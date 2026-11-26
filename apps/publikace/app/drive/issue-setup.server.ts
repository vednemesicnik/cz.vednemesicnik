import type { Article, ArticleStore } from '../data/articles.server.ts'
import type { GroupStore, ListedGroup } from '../data/artwork-groups.server.ts'
import type { IssueStore } from '../data/issues.server.ts'
import { articleMeta, META_FILE_NAME } from '../domain/article.ts'
import { groupMeta } from '../domain/artwork-group.ts'
import {
  ARTICLES_FOLDER_NAME,
  type FolderKind,
  type Issue,
  issueNameKey,
  missingFolders,
  PRINT_FOLDER_NAME,
} from '../domain/issue.ts'
import type { DriveAccessToken } from './access-token.server.ts'
import { checkArticleFolders } from './article-folders.server.ts'
import type { DriveFolders } from './folders.server.ts'
import type { IssueFiles } from './issue-files.server.ts'
import { checkIssueFolders } from './issue-folders.server.ts'
import { logDriveFailure } from './log.server.ts'
import { createLock } from './one-at-a-time.server.ts'
import { binOwnFolder, type ForeignChild } from './own-folder-bin.server.ts'

/**
 * Creating an issue and finishing one that Drive stopped halfway (`11d`, `12i`, `1jv85zum`).
 *
 * The row comes first and each folder's ID is stored the moment Drive returns it. When Drive
 * fails at the issue folder itself, the row goes in the same request, so _Nic se nevytvořilo_ is
 * true and the name is free again. After the issue folder, the issue stays _Nedokončené_ and
 * nothing goes to the bin: the issue is the one action that is finished rather than cleaned up
 * (`11c`), because an editor-in-chief can see it and press _Dokončit vydání_.
 */

export type IssueSetup = {
  folders(accessToken: string): DriveFolders
  /** The folder on the shared drive that holds every issue: `ISSUES_FOLDER_ID`. */
  issuesFolderId: string
  now(): Temporal.Instant
  store: IssueStore
  token(): Promise<DriveAccessToken>
}

/** Why nothing was attempted, or why Drive stopped before the issue folder existed. */
export type Unreached = 'disconnected' | 'not-connected' | 'unavailable'

export type CreateOutcome =
  | { existingName: string; kind: 'duplicate' }
  | { issue: Issue; kind: 'created' }
  | { issue: Issue; kind: 'unfinished' }
  | { kind: Unreached }

export type FinishOutcome =
  | { issue: Issue; kind: 'finished' }
  | { kind: 'folder-gone' }
  /* The row went while this waited: its creation failed at the issue folder. */
  | { kind: 'not-found' }
  | { kind: Unreached }

export type Starter = { displayName: string; email: string }

const CHILD_NAMES: Record<Exclude<FolderKind, 'issue'>, string> = {
  articles: ARTICLES_FOLDER_NAME,
  print: PRINT_FOLDER_NAME,
}

/* One step at a time per issue name: creating, finishing, or both at once (`createLock`). */
const lock = createLock()

function oneAtATime<T>(name: string, run: () => Promise<T>): Promise<T> {
  return lock(issueNameKey(name), run)
}

/**
 * Runs under the issue's name, as creating, finishing and renaming it do. A fix on one of its
 * articles writes that article's `_meta.json`, which a rename of the issue writes too, so the two
 * take turns rather than each write over what the other read.
 */
export const underIssueName = oneAtATime

/**
 * A name already in the app is refused before Google is asked anything. The token comes next,
 * before the row is written, so an account that is not connected leaves nothing behind and the
 * dialog can say so with the field still filled (`14g`). The insert checks the name again, in
 * its own transaction, for two editors sending the same name at once.
 */
export function createIssue(
  setup: IssueSetup,
  name: string,
  starter: Starter,
): Promise<CreateOutcome> {
  return oneAtATime(name, () => create(setup, name, starter))
}

async function create(setup: IssueSetup, name: string, starter: Starter): Promise<CreateOutcome> {
  let existing = await setup.store.findByName(name)
  if (existing !== null) return { existingName: existing.name, kind: 'duplicate' }

  if (setup.issuesFolderId === '') {
    logDriveFailure('an issue was not created', 'ISSUES_FOLDER_ID is empty')
    return { kind: 'unavailable' }
  }
  let token = await setup.token()
  if (!token.ok) return { kind: token.reason }

  let inserted = await setup.store.insert({
    at: setup.now(),
    name,
    startedByEmail: starter.email,
    startedByName: starter.displayName,
  })
  if (!inserted.ok) return { existingName: inserted.existingName, kind: 'duplicate' }

  let issue = inserted.issue
  let folders = setup.folders(token.accessToken)

  let issueFolder = await folders.create(setup.issuesFolderId, issue.name)
  if (!issueFolder.ok) {
    await setup.store.remove(issue.id)
    return { kind: 'unavailable' }
  }
  await setup.store.setFolder(issue.id, 'issue', issueFolder.id)

  /* A brand-new folder has no children, so they are created without looking first. */
  for (let kind of ['articles', 'print'] as const) {
    let child = await folders.create(issueFolder.id, CHILD_NAMES[kind])
    if (!child.ok) return { issue: await reload(setup, issue), kind: 'unfinished' }
    await setup.store.setFolder(issue.id, kind, child.id)
  }

  await setup.store.complete(issue.id, setup.now())
  return { issue: await reload(setup, issue), kind: 'created' }
}

/**
 * _Dokončit vydání_: adds what is missing and creates nothing twice.
 *
 * The stored issue folder is checked first. One that is gone is not created again, because the
 * folder somebody removed would then exist twice (`12i`); the editor restores it and finishes.
 * A child folder is looked for by name inside the issue's own folder before it is created, so a
 * folder Drive made while its reply was lost is adopted rather than doubled. The issue folder
 * itself is never looked for by name: a folder of the same name may be an issue from before the
 * app.
 */
export function finishIssue(setup: IssueSetup, issue: Issue): Promise<FinishOutcome> {
  return oneAtATime(issue.name, async () => {
    /* Read again under the lock: the caller's copy may predate a step that just finished. */
    let current = await setup.store.findByName(issue.name)
    return current === null ? { kind: 'not-found' } : finish(setup, current)
  })
}

async function finish(setup: IssueSetup, issue: Issue): Promise<FinishOutcome> {
  if (missingFolders(issue).length === 0) {
    await setup.store.complete(issue.id, setup.now())
    return { issue: await reload(setup, issue), kind: 'finished' }
  }

  let issueFolderId = issue.folderIds.issue
  if (issueFolderId === null && setup.issuesFolderId === '') {
    logDriveFailure('an issue was not finished', 'ISSUES_FOLDER_ID is empty')
    return { kind: 'unavailable' }
  }

  let token = await setup.token()
  if (!token.ok) return { kind: token.reason }
  let folders = setup.folders(token.accessToken)

  if (issueFolderId === null) {
    /* Only a process that stopped between the row and the first folder leaves this. */
    let created = await folders.create(setup.issuesFolderId, issue.name)
    if (!created.ok) return { kind: 'unavailable' }
    issueFolderId = created.id
    await setup.store.setFolder(issue.id, 'issue', issueFolderId)
  } else {
    let presence = await folders.presence(issueFolderId)
    if (presence === 'gone') return { kind: 'folder-gone' }
    if (presence === 'unavailable') return { kind: 'unavailable' }
  }

  for (let kind of ['articles', 'print'] as const) {
    if (issue.folderIds[kind] !== null) continue

    let found = await folders.findChild(issueFolderId, CHILD_NAMES[kind])
    if (!found.ok) return { kind: 'unavailable' }

    let childId = found.id
    if (childId === null) {
      let created = await folders.create(issueFolderId, CHILD_NAMES[kind])
      if (!created.ok) return { kind: 'unavailable' }
      childId = created.id
    }
    await setup.store.setFolder(issue.id, kind, childId)
  }

  await setup.store.complete(issue.id, setup.now())
  return { issue: await reload(setup, issue), kind: 'finished' }
}

async function reload(setup: IssueSetup, issue: Issue): Promise<Issue> {
  return (await setup.store.findByName(issue.name)) ?? issue
}

/* ---------- Přejmenovat vydání (`12v`) and Odebrat vydání (`12w`) ---------- */

/** What renaming and removing an issue need beside creating one (`12v`, `12w`). */
export type IssueFixSetup = IssueSetup & {
  /** The issue's articles, whose `_meta.json` a rename writes over. */
  articles: Pick<ArticleStore, 'clearMissing' | 'listCreated' | 'markMissing'>
  files(accessToken: string): IssueFiles
  /** The issue's artwork groups, whose `_meta.json` a rename writes over too. */
  groups: Pick<GroupStore, 'clearMissing' | 'listByIssue' | 'markMissing'>
}

/** A folder or a `_meta.json` named by what it belongs to, for the dialog's Callout. */
export type NamedFile = { fileId: string; name: string }

export type RenameIssueOutcome =
  | { issue: Issue; kind: 'renamed' }
  | { kind: 'unchanged' }
  | { existingName: string; kind: 'duplicate' }
  | { issue: Issue; kind: 'closed' }
  | { issue: Issue; kind: 'renamed-meanwhile' }
  | { kind: 'removed' }
  | { kind: 'issue-folder-missing' }
  | { kind: 'articles-folder-missing'; name: string }
  | { articles: NamedFile[]; groups: NamedFile[]; kind: 'folders-missing' }
  | { files: (NamedFile & { holder: 'article' | 'group' })[]; kind: 'files-binned' }
  | { kind: Unreached }

/**
 * Both names locked, in one order, so that two renames crossing each other cannot wait on each
 * other, and neither name can be created or finished meanwhile.
 */
function underBothNames<T>(first: string, second: string, run: () => Promise<T>): Promise<T> {
  let [low, high] = [issueNameKey(first), issueNameKey(second)].sort()
  if (low === undefined || high === undefined || low === high) {
    return lock(low ?? issueNameKey(first), run)
  }
  return lock(low, () => lock(high, run))
}

/**
 * _Přejmenovat vydání_: the folder on Drive and the `issue` in every article's and group's
 * `_meta.json`, then the row, all or nothing (`12v`, `11c`). Drive comes first, because a name on
 * Drive is what a person may still see; the row commits only while nothing changed under it, and
 * otherwise every file goes back to what it was. An article or a group that came meanwhile makes
 * the rename start over once, since its `_meta.json` must carry the new name too.
 */
export function renameIssue(
  setup: IssueFixSetup,
  input: { id: number; name: string; shownName: string },
): Promise<RenameIssueOutcome> {
  return underBothNames(input.shownName, input.name, async () => {
    let current = await setup.store.findById(input.id)
    if (current === null || current.removedAt !== null) return { kind: 'removed' }
    if (current.name !== input.shownName) return { issue: current, kind: 'renamed-meanwhile' }
    if (current.closedAt !== null) return { issue: current, kind: 'closed' }
    if (current.name === input.name) return { kind: 'unchanged' }
    let taken = await setup.store.findByName(input.name)
    if (taken !== null && taken.id !== current.id) {
      return { existingName: taken.name, kind: 'duplicate' }
    }

    let folderId = current.folderIds.issue
    /* An issue whose creation stopped before its folder has nothing on Drive to rename. */
    if (folderId === null) return commitRename(setup, current, input, [], [])

    let token = await setup.token()
    if (!token.ok) return { kind: token.reason }
    let outcome = await renameOnDrive(setup, token.accessToken, current, folderId, input)
    if (outcome !== 'changed') return outcome
    let again = await setup.store.findById(input.id)
    if (again === null) return { kind: 'removed' }
    let retried = await renameOnDrive(setup, token.accessToken, again, folderId, input)
    return retried === 'changed' ? { kind: 'unavailable' } : retried
  })
}

export type Undo = () => Promise<boolean>

async function renameOnDrive(
  setup: IssueFixSetup,
  accessToken: string,
  issue: Issue,
  folderId: string,
  input: { id: number; name: string; shownName: string },
): Promise<RenameIssueOutcome | 'changed'> {
  let files = setup.files(accessToken)
  let folders = setup.folders(accessToken)
  let now = () => setup.now()

  if (issue.completedAt === null) {
    let standing = await folders.standing(folderId)
    if (standing === 'unavailable') return { kind: 'unavailable' }
    if (standing !== 'exists') return { kind: 'issue-folder-missing' }
  } else {
    let check = await checkIssueFolders({ folders, issues: setup.store, now }, issue)
    if (check === 'unavailable') return { kind: 'unavailable' }
    if (check.missing.includes('issue')) return { kind: 'issue-folder-missing' }
    if (check.missing.includes('articles')) {
      return { kind: 'articles-folder-missing', name: issue.name }
    }
  }

  let articles = await setup.articles.listCreated(issue.id)
  let groups = await setup.groups.listByIssue(issue.id)
  let missingArticles: NamedFile[] = []
  for (let article of articles) {
    let check = await checkArticleFolders(
      { articles: setup.articles, folders, now },
      { ...article, kind: 'article' },
      ['article'],
    )
    if (check === 'unavailable') return { kind: 'unavailable' }
    if (check.missing.length > 0)
      missingArticles.push({ fileId: article.folderId, name: article.name })
  }
  let missingGroups: NamedFile[] = []
  for (let group of groups) {
    let check = await checkArticleFolders(
      { articles: setup.articles, folders, groups: setup.groups, now },
      { ...group, kind: 'group' },
      ['article'],
    )
    if (check === 'unavailable') return { kind: 'unavailable' }
    if (check.missing.length > 0) {
      missingGroups.push({ fileId: group.folderId ?? '', name: group.name })
    }
  }
  if (missingArticles.length + missingGroups.length > 0) {
    return { articles: missingArticles, groups: missingGroups, kind: 'folders-missing' }
  }

  let metas = await metaFilesOf(files, issue, input.name, articles, groups)
  if (metas === 'unavailable') return { kind: 'unavailable' }
  let binned = metas.filter((meta) => meta.state === 'binned')
  if (binned.length > 0) {
    return {
      files: binned.map((meta) => ({ fileId: meta.fileId, holder: meta.holder, name: meta.name })),
      kind: 'files-binned',
    }
  }

  let undo: Undo[] = []
  let recreated = { articles: new Map<number, string>(), groups: new Map<number, string>() }
  let isWritten = await files.rename(folderId, input.name)
  if (isWritten) undo.push(() => files.rename(folderId, issue.name))
  for (let meta of metas) {
    if (!isWritten) break
    if (meta.state === 'here') {
      isWritten = await files.replaceText(meta.fileId, meta.renamed)
      if (isWritten) undo.push(() => files.replaceText(meta.fileId, meta.current))
    } else {
      /* Deleted for good, so restoring it is not possible: written anew where it belongs, with
         the key of the article's or group's own attempt, as the app's file. */
      let made = await files.uploadJson(meta.folderId, META_FILE_NAME, meta.renamed, meta.formKey)
      isWritten = made.ok
      if (made.ok) {
        undo.push(() => files.trash(made.id))
        ;(meta.holder === 'article' ? recreated.articles : recreated.groups).set(meta.id, made.id)
      }
    }
  }

  let committed = isWritten
    ? await setup.store.rename({
        expected: {
          articles: articles.map((each) => each.id),
          groups: groups.map((each) => each.id),
        },
        id: issue.id,
        metaFiles: recreated,
        name: input.name,
        shownName: input.shownName,
      })
    : null
  if (committed === 'renamed') {
    let renamed = await setup.store.findById(issue.id)
    return renamed === null ? { kind: 'removed' } : { issue: renamed, kind: 'renamed' }
  }

  await undoAll(undo)
  if (committed === null) return { kind: 'unavailable' }
  if (committed === 'changed') return 'changed'
  return answerOf(setup, issue.id, committed, input.name)
}

/** The row alone, for an issue with nothing on Drive yet. */
async function commitRename(
  setup: IssueSetup,
  issue: Issue,
  input: { name: string; shownName: string },
  articles: readonly number[],
  groups: readonly number[],
): Promise<RenameIssueOutcome> {
  let committed = await setup.store.rename({
    expected: { articles, groups },
    id: issue.id,
    metaFiles: { articles: new Map(), groups: new Map() },
    name: input.name,
    shownName: input.shownName,
  })
  if (committed === 'renamed') {
    let renamed = await setup.store.findById(issue.id)
    return renamed === null ? { kind: 'removed' } : { issue: renamed, kind: 'renamed' }
  }
  /* An unfinished issue takes no article and no group, so nothing can come into it. */
  if (committed === 'changed') return { kind: 'unavailable' }
  return answerOf(setup, issue.id, committed, input.name)
}

/** What a refused commit says, from the row as it stands now. */
async function answerOf(
  setup: IssueSetup,
  id: number,
  refusal: 'closed' | 'duplicate' | 'removed' | 'renamed-meanwhile',
  newName: string,
): Promise<RenameIssueOutcome> {
  let now = await setup.store.findById(id)
  if (now === null || refusal === 'removed') return { kind: 'removed' }
  if (refusal === 'closed') return { issue: now, kind: 'closed' }
  if (refusal === 'renamed-meanwhile') return { issue: now, kind: 'renamed-meanwhile' }
  let taken = await setup.store.findByName(newName)
  return { existingName: taken?.name ?? newName, kind: 'duplicate' }
}

/** Newest first, as the steps were made; a step Drive would not take back is logged. */
export async function undoAll(undo: readonly Undo[]): Promise<void> {
  for (let step of [...undo].reverse()) {
    if (!(await step())) logDriveFailure('a rename was not undone', 'Drive refused a step back')
  }
}

type MetaFile = {
  /** What the file holds now, for putting it back. */
  current: string
  fileId: string
  folderId: string
  formKey: string
  holder: 'article' | 'group'
  id: number
  name: string
  renamed: string
  state: 'binned' | 'deleted' | 'here'
}

/** Every `_meta.json` of the issue, where Drive has it, and what it holds before and after. */
async function metaFilesOf(
  files: IssueFiles,
  issue: Issue,
  newName: string,
  articles: readonly Article[],
  groups: readonly ListedGroup[],
): Promise<MetaFile[] | 'unavailable'> {
  let issueFolderId = issue.folderIds.issue ?? ''
  let metas: MetaFile[] = []
  for (let article of articles) {
    let content = (name: string) =>
      articleMeta({
        articleFolderId: article.folderId,
        articleName: article.name,
        authors: article.authors,
        docId: article.docId,
        issue: name,
        issueFolderId,
      })
    let state = await stateOf(files, article.metaFileId)
    if (state === 'unavailable') return state
    metas.push({
      current: content(issue.name),
      fileId: article.metaFileId ?? '',
      folderId: article.folderId,
      formKey: article.formKey,
      holder: 'article',
      id: article.id,
      name: article.name,
      renamed: content(newName),
      state,
    })
  }
  for (let group of groups) {
    let groupFolderId = group.folderId ?? ''
    let content = (name: string) =>
      groupMeta({ groupFolderId, issue: name, issueFolderId, name: group.name, note: group.note })
    let state = await stateOf(files, group.metaFileId)
    if (state === 'unavailable') return state
    metas.push({
      current: content(issue.name),
      fileId: group.metaFileId ?? '',
      folderId: groupFolderId,
      formKey: group.formKey,
      holder: 'group',
      id: group.id,
      name: group.name,
      renamed: content(newName),
      state,
    })
  }
  return metas
}

/** Where a file the app keeps an ID of is: on the drive, in the bin, or gone for good. */
export async function stateOf(
  files: IssueFiles,
  fileId: string | null,
): Promise<MetaFile['state'] | 'unavailable'> {
  if (fileId === null) return 'deleted'
  let location = await files.locate(fileId)
  if (location.kind === 'unavailable') return 'unavailable'
  return location.kind === 'binned' ? 'binned' : location.kind === 'deleted' ? 'deleted' : 'here'
}

export type RemoveIssueOutcome =
  | { issue: Issue; kind: 'removed' }
  | { kind: 'already-removed' }
  | { issue: Issue; kind: 'has-article' | 'has-group' }
  | { folderId: string; kind: 'moved' }
  | { files: ForeignChild[]; kind: 'foreign' }
  | { kind: Unreached }

/**
 * _Odebrat vydání_: the row is marked first, so its link answers as gone at once and no article
 * can start in a folder about to go to the bin; then the issue folder goes to the bin with
 * everything in it, when it holds only what the app made and stands where the app made it.
 * Anything else takes the mark back and leaves Drive as it was (`12w`).
 */
export async function removeIssue(
  setup: IssueFixSetup,
  input: { id: number },
): Promise<RemoveIssueOutcome> {
  let first = await setup.store.findById(input.id)
  if (first === null || first.removedAt !== null) return { kind: 'already-removed' }
  return oneAtATime(first.name, async () => {
    let issue = await setup.store.findById(input.id)
    if (issue === null || issue.removedAt !== null) return { kind: 'already-removed' }
    let folderId = issue.folderIds.issue

    let token: DriveAccessToken | null = null
    if (folderId !== null) {
      if (setup.issuesFolderId === '') {
        logDriveFailure('an issue was not removed', 'ISSUES_FOLDER_ID is empty')
        return { kind: 'unavailable' }
      }
      token = await setup.token()
      if (!token.ok) return { kind: token.reason }
    }

    let marked = await setup.store.markRemoved(issue.id, setup.now())
    if (marked === 'already-removed') return { kind: 'already-removed' }
    if (marked !== 'removed') return { issue, kind: marked }
    if (folderId === null || token === null || !token.ok) return { issue, kind: 'removed' }

    let printSheetId = await setup.store.printSheetId(issue.id)
    let ownIds = new Set(
      [
        folderId,
        issue.folderIds.articles,
        issue.folderIds.print,
        issue.groupsFolderId,
        issue.evidenceSpreadsheetId,
        printSheetId,
      ].filter((id): id is string => id !== null),
    )
    let binned = await binOwnFolder(setup.files(token.accessToken), {
      expectedParentId: setup.issuesFolderId,
      folderId,
      folderName: issue.name,
      folderOrder: [
        folderId,
        issue.folderIds.articles,
        issue.groupsFolderId,
        issue.folderIds.print,
      ].filter((id): id is string => id !== null),
      ownIds,
    })
    if (binned.kind === 'binned' || binned.kind === 'already-binned') {
      return { issue, kind: 'removed' }
    }
    await setup.store.unmarkRemoved(issue.id)
    if (binned.kind === 'moved') return { folderId, kind: 'moved' }
    if (binned.kind === 'foreign') return { files: binned.files, kind: 'foreign' }
    return { kind: 'unavailable' }
  })
}
