import type { ArticleStore } from '../data/articles.server.ts'
import type {
  EditGroupOutcome,
  GroupRow,
  GroupStore,
  RemoveGroupOutcome,
} from '../data/artwork-groups.server.ts'
import type { IssueStore } from '../data/issues.server.ts'
import { META_FILE_NAME } from '../domain/article.ts'
import { checkGroup, groupMeta } from '../domain/artwork-group.ts'
import { isGroupRename, otherGroupNames } from '../domain/group-fixes.ts'
import type { Issue } from '../domain/issue.ts'
import type { DriveAccessToken } from './access-token.server.ts'
import { underIssue } from './article-fixes.server.ts'
import { checkArticleFolders } from './article-folders.server.ts'
import type { DriveFolders } from './folders.server.ts'
import type { IssueFiles } from './issue-files.server.ts'
import { stateOf, type Undo, type Unreached, undoAll } from './issue-setup.server.ts'
import { logDriveFailure } from './log.server.ts'
import { binOwnFolder, type ForeignChild } from './own-folder-bin.server.ts'

/**
 * Mending an artwork group made wrong (#154, `12f`): its name and note, and removing one created by
 * mistake.
 *
 * All or nothing, as every fix (`11c`). A note alone is the app's and asks Drive nothing. A rename
 * renames the group folder and rewrites `_meta.json` first, because they are what a person may
 * still see, then the row, which commits only while nothing changed under the dialog; otherwise
 * both files go back to what they were. Each runs under the issue's name, because a rename of the
 * issue writes the same `_meta.json`. Nothing is sent to anybody.
 */

export type GroupFixSetup = {
  articles: Pick<ArticleStore, 'clearMissing' | 'markMissing'>
  files(accessToken: string): IssueFiles
  folders(accessToken: string): DriveFolders
  groups: Pick<
    GroupStore,
    | 'clearMissing'
    | 'edit'
    | 'findById'
    | 'markMissing'
    | 'markRemoved'
    | 'namesOf'
    | 'unmarkRemoved'
  >
  issues: Pick<IssueStore, 'findById'>
  now(): Temporal.Instant
  token(): Promise<DriveAccessToken>
}

export type GroupEditInput = {
  id: number
  name: string
  note: string
  shownName: string
  shownNote: string
}

export type EditGroupFixOutcome =
  | Exclude<EditGroupOutcome, { kind: 'name-taken' | 'saved' }>
  | { isRenamed: boolean; kind: 'saved' }
  | { kind: 'unchanged' }
  | { errors: { name: string | null; note: string | null }; kind: 'invalid' }
  | { kind: 'folder-missing' }
  | { fileId: string; kind: 'meta-binned' }
  | { kind: Unreached }

/** A committed group that is not removed, with the IDs its files were stored under. */
type CreatedGroup = GroupRow & {
  artworksFolderId: string
  folderId: string
  licencesFolderId: string
}

async function createdGroup(setup: GroupFixSetup, id: number): Promise<CreatedGroup | null> {
  let row = await setup.groups.findById(id)
  if (row === null || row.createdAt === null || row.removedAt !== null) return null
  let { artworksFolderId, folderId, licencesFolderId } = row
  if (artworksFolderId === null || folderId === null || licencesFolderId === null) return null
  return { ...row, artworksFolderId, folderId, licencesFolderId }
}

function metaOf(group: CreatedGroup, issue: Issue, name: string, note: string): string {
  return groupMeta({
    groupFolderId: group.folderId,
    issue: issue.name,
    issueFolderId: issue.folderIds.issue ?? '',
    name,
    note,
  })
}

/**
 * _Upravit skupinu_ (`12f`). The fields' own rules first, against the issue's other groups; then a
 * race, which the commit decides again; then, only on a rename, Drive.
 */
export async function editGroup(
  setup: GroupFixSetup,
  input: GroupEditInput,
): Promise<EditGroupFixOutcome> {
  let found = await createdGroup(setup, input.id)
  if (found === null) return { kind: 'gone' }
  let outcome = await underIssue(setup, found.issueId, async (issue) => {
    let group = await createdGroup(setup, input.id)
    if (group === null) return { kind: 'gone' as const }
    /* What the commit would refuse, answered before anything else: a form showing an old group
       cannot be saved, whatever its fields say (`12f`). */
    if (issue.closedAt !== null) return { issueName: issue.name, kind: 'closed' as const }
    if (group.name !== input.shownName || group.note !== input.shownNote) {
      return { kind: 'changed-meanwhile' as const }
    }
    let names = otherGroupNames(await setup.groups.namesOf(issue.id), group.name)
    let check = checkGroup(input, names)
    if (!check.ok) return { errors: check.errors, kind: 'invalid' as const }
    if (check.name === group.name && check.note === group.note) {
      return { kind: 'unchanged' as const }
    }
    let edit = { ...check, id: group.id, shownName: input.shownName, shownNote: input.shownNote }

    if (!isGroupRename(group.name, check.name)) {
      let saved = await setup.groups.edit(edit)
      return saved.kind === 'name-taken' ? retaken(setup, issue, input) : saved
    }

    let token = await setup.token()
    if (!token.ok) return { kind: token.reason }
    let written = await renameOnDrive(setup, token.accessToken, group, issue, check)
    if ('kind' in written) return written

    try {
      let saved = await setup.groups.edit({
        ...edit,
        ...(written.metaFileId === undefined ? {} : { metaFileId: written.metaFileId }),
      })
      if (saved.kind === 'saved') return saved
      await undoAll(written.undo)
      return saved.kind === 'name-taken' ? retaken(setup, issue, input) : saved
    } catch (error) {
      logDriveFailure(
        'an artwork group fix was not saved',
        error instanceof Error ? error.message : 'unknown error',
      )
      await undoAll(written.undo)
      return { kind: 'unavailable' as const }
    }
  })
  if (outcome.kind !== 'saved') return outcome
  let saved = await setup.groups.findById(input.id)
  return { isRenamed: saved !== null && saved.name !== found.name, kind: 'saved' }
}

/**
 * Another request took the name between the check and the commit, or a failed attempt waiting for
 * its cleanup holds it: that one is no group, so Drive is what failed, as in `createGroup`.
 */
async function retaken(
  setup: GroupFixSetup,
  issue: Issue,
  input: GroupEditInput,
): Promise<EditGroupFixOutcome> {
  let names = otherGroupNames(await setup.groups.namesOf(issue.id), input.shownName)
  let again = checkGroup(input, names)
  return again.ok ? { kind: 'unavailable' } : { errors: again.errors, kind: 'invalid' }
}

type RenameRefusal =
  | { kind: 'folder-missing' }
  | { fileId: string; kind: 'meta-binned' }
  | { kind: 'unavailable' }

/**
 * The group folder checked and renamed, then `_meta.json` written over: in place when it is on the
 * drive, anew with the group's own key when it was deleted for good, and refused when it is in the
 * bin, where a person can restore it (`12f`). A missing folder comes first, since restoring it
 * brings back the file in it too.
 */
async function renameOnDrive(
  setup: GroupFixSetup,
  accessToken: string,
  group: CreatedGroup,
  issue: Issue,
  next: { name: string; note: string },
): Promise<{ metaFileId?: string; undo: Undo[] } | RenameRefusal> {
  let files = setup.files(accessToken)
  let check = await checkArticleFolders(
    {
      articles: setup.articles,
      folders: setup.folders(accessToken),
      groups: setup.groups,
      now: () => setup.now(),
    },
    { ...group, kind: 'group' },
    ['article'],
  )
  if (check === 'unavailable') return { kind: 'unavailable' }
  if (check.missing.length > 0) return { kind: 'folder-missing' }
  let meta = await stateOf(files, group.metaFileId)
  if (meta === 'unavailable') return { kind: 'unavailable' }
  if (meta === 'binned') return { fileId: group.metaFileId ?? '', kind: 'meta-binned' }

  let undo: Undo[] = []
  let folderId = group.folderId
  if (!(await files.rename(folderId, next.name))) return { kind: 'unavailable' }
  undo.push(() => files.rename(folderId, group.name))

  let content = metaOf(group, issue, next.name, next.note)
  if (meta === 'here') {
    let fileId = group.metaFileId ?? ''
    if (!(await files.replaceText(fileId, content))) {
      await undoAll(undo)
      return { kind: 'unavailable' }
    }
    undo.push(() => files.replaceText(fileId, metaOf(group, issue, group.name, group.note)))
    return { undo }
  }
  let made = await files.uploadJson(folderId, META_FILE_NAME, content, group.formKey)
  if (!made.ok) {
    await undoAll(undo)
    return { kind: 'unavailable' }
  }
  undo.push(() => files.trash(made.id))
  return { metaFileId: made.id, undo }
}

export type RemoveGroupFixOutcome =
  | RemoveGroupOutcome
  | { folderId: string; kind: 'moved' }
  | { files: ForeignChild[]; kind: 'foreign' }
  | { kind: 'gone' }
  | { kind: Unreached }

/**
 * _Odebrat skupinu_ (`12f`), in the shape of the article's removal: the row is marked first, so the
 * link answers as gone at once and no batch can start in a folder about to go to the bin; then the
 * group folder goes to the bin with everything in it, when it holds only what the app made and
 * stands in `Skupiny obrazových děl` of its issue. Anything else takes the mark back and leaves
 * Drive as it was. A folder already in the bin stays there and the removal goes through.
 */
export async function removeGroup(
  setup: GroupFixSetup,
  input: { id: number },
): Promise<RemoveGroupFixOutcome> {
  let found = await setup.groups.findById(input.id)
  if (found === null || found.createdAt === null || found.removedAt !== null) {
    return { kind: 'already-removed' }
  }
  return underIssue(setup, found.issueId, async (issue) => {
    let group = await createdGroup(setup, input.id)
    if (group === null) return { kind: 'already-removed' }
    if (issue.closedAt !== null) return { issueName: issue.name, kind: 'closed' }
    let groupsFolderId = issue.groupsFolderId
    if (groupsFolderId === null) return { kind: 'unavailable' }

    let token = await setup.token()
    if (!token.ok) return { kind: token.reason }

    let at = setup.now()
    let marked = await setup.groups.markRemoved(group.id, at)
    if (marked.kind !== 'removed') return marked

    let ownIds = new Set(
      [group.folderId, group.artworksFolderId, group.licencesFolderId, group.metaFileId].filter(
        (id): id is string => id !== null,
      ),
    )
    let binned = await binOwnFolder(setup.files(token.accessToken), {
      expectedParentId: groupsFolderId,
      folderId: group.folderId,
      folderName: group.name,
      folderOrder: [group.folderId, group.artworksFolderId, group.licencesFolderId].filter(
        (id): id is string => id !== null,
      ),
      ownIds,
    })
    if (binned.kind === 'binned' || binned.kind === 'already-binned') return { kind: 'removed' }
    await setup.groups.unmarkRemoved(group.id, at)
    if (binned.kind === 'moved') return { folderId: group.folderId, kind: 'moved' }
    if (binned.kind === 'foreign') return { files: binned.files, kind: 'foreign' }
    return { kind: 'unavailable' }
  })
}
