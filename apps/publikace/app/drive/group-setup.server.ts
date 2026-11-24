import type { GroupRow, GroupStore } from '../data/artwork-groups.server.ts'
import type { IssueStore } from '../data/issues.server.ts'
import { META_FILE_NAME } from '../domain/article.ts'
import { ARTWORKS_FOLDER_NAME, LICENCES_FOLDER_NAME } from '../domain/article-folders.ts'
import {
  checkGroup,
  type GroupInput,
  groupMeta,
  GROUPS_FOLDER_NAME,
} from '../domain/artwork-group.ts'
import { type Issue, issueState } from '../domain/issue.ts'
import type { DriveAccessToken } from './access-token.server.ts'
import type { ArticleFiles } from './article-files.server.ts'
import type { ArticleSetup } from './article-setup.server.ts'
import type { ArtworksSetup } from './artworks-setup.server.ts'
import type { DriveFolders } from './folders.server.ts'
import { logDriveFailure } from './log.server.ts'
import { createLock } from './one-at-a-time.server.ts'

/**
 * Creating an artwork group from the issue detail (#133, `12e`).
 *
 * All or nothing, as every action but the issue is (`11c`, `03` row 43): the attempt's row comes
 * first and each file's ID is stored the moment Drive returns it; when a step fails, the group's
 * folder, the two inside it and `_meta.json` go to the shared drive's bin, found by their stored
 * IDs and by the form key on each, never by a name, and the row goes with them.
 *
 * `Skupiny obrazových děl` is the issue's, not the attempt's. It is made with the issue's first
 * group, tagged with the issue's own key so that a reply Drive lost does not make a second one, and
 * stored at once; a failed attempt leaves it where it is. One somebody removed is never made again:
 * the app does not recreate what a person took away, so _Nová skupina_ then answers as when Drive
 * does not.
 *
 * No e-mail goes: the editors-in-chief hand the link to the provider themselves (`12e`).
 */

export type GroupSetup = {
  files(accessToken: string): ArticleFiles
  folders(accessToken: string): DriveFolders
  groups: GroupStore
  issues: IssueStore
  now(): Temporal.Instant
  token(): Promise<DriveAccessToken>
}

export type NewGroup = GroupInput & {
  /** The dialog's one-time key: a second send with it gets the first one's answer. */
  formKey: string
  issueId: number
  startedBy: { email: string; name: string }
}

export type CreateGroupOutcome =
  | { group: GroupRow; kind: 'created' }
  | { errors: { name: string | null; note: string | null }; kind: 'invalid' }
  | { kind: 'disconnected' | 'not-connected' }
  /** The issue is not active: unfinished issues and closed ones take no group (`01a`, `12h`). */
  | { kind: 'not-active' }
  | { kind: 'unavailable' }

/** The setup out of the article's and the artworks', which hold every part of it. */
export function groupSetupOf(
  articles: Pick<ArticleSetup, 'files' | 'folders' | 'issues' | 'now' | 'token'>,
  artworks: Pick<ArtworksSetup, 'groups'>,
): GroupSetup {
  return {
    files: articles.files,
    folders: articles.folders,
    groups: artworks.groups,
    issues: articles.issues,
    now: articles.now,
    token: articles.token,
  }
}

const lock = createLock()

export function createGroup(setup: GroupSetup, input: NewGroup): Promise<CreateGroupOutcome> {
  return lock(`group:${input.formKey}`, () => create(setup, input))
}

/** The key the issue's `Skupiny obrazových děl` carries on Drive. */
function groupsFolderKey(issueId: number): string {
  return `issue-groups:${issueId}`
}

async function create(setup: GroupSetup, input: NewGroup): Promise<CreateGroupOutcome> {
  let existing = await setup.groups.findByFormKey(input.formKey)
  if (existing !== null && existing.issueId !== input.issueId) return { kind: 'unavailable' }
  if (existing?.createdAt != null) return { group: existing, kind: 'created' }

  let issue = await setup.issues.findById(input.issueId)
  if (issue === null || issueState(issue) !== 'active') return { kind: 'not-active' }
  let issueFolderId = issue.folderIds.issue
  if (issueFolderId === null) return { kind: 'not-active' }
  /* A field the dialog can name is named before anything else, Drive's answer included. */
  let early = checkGroup(input, await setup.groups.namesOf(issue.id))
  if (!early.ok) return { errors: early.errors, kind: 'invalid' }

  let token = await setup.token()
  if (!token.ok) return { kind: token.reason }
  let files = setup.files(token.accessToken)

  await cleanUpPending(setup, files, input.formKey)
  /* This form's own earlier attempt is still waiting for its files to reach the bin. */
  if ((await setup.groups.findByFormKey(input.formKey)) !== null) return { kind: 'unavailable' }

  /* Read again: another request may have taken the name while this one waited on Drive. */
  let check = checkGroup(input, await setup.groups.namesOf(issue.id))
  if (!check.ok) return { errors: check.errors, kind: 'invalid' }

  let groupsFolderId = await lock(`issue-groups:${issue.id}`, () =>
    groupsFolderOf(setup, token.accessToken, files, issue, issueFolderId),
  )
  if (groupsFolderId === null) return { kind: 'unavailable' }

  let started = await setup.groups.startAttempt({
    at: setup.now(),
    formKey: input.formKey,
    issueId: issue.id,
    name: check.name,
    nameKey: check.nameKey,
    note: check.note,
    startedBy: input.startedBy,
  })
  /* Another request took the name between the check and the row, or a failed attempt whose
     files Drive would not take still holds it: that one is no group, so Drive is what failed. */
  if (started === 'name-taken') {
    let names = await setup.groups.namesOf(issue.id)
    let again = checkGroup(input, names)
    return again.ok ? { kind: 'unavailable' } : { errors: again.errors, kind: 'invalid' }
  }

  let committed: GroupRow | null = null
  try {
    if (await makeFiles(setup, files, started.attempt, issue, issueFolderId, groupsFolderId)) {
      committed = await setup.groups.commit(started.attempt.id, setup.now())
    }
  } catch (error) {
    logDriveFailure(
      'an artwork group was not created',
      error instanceof Error ? error.message : 'unknown error',
    )
  }
  if (committed === null) {
    await cleanUp(setup, files, started.attempt, groupsFolderId)
    return { kind: 'unavailable' }
  }
  return { group: committed, kind: 'created' }
}

/**
 * The issue's `Skupiny obrazových děl`: the stored one while it is there, else one this issue's key
 * finds after a reply Drive lost, else a new one. `null` when Drive does not answer, or when the
 * stored one is gone: it is not made again.
 */
async function groupsFolderOf(
  setup: GroupSetup,
  accessToken: string,
  files: ArticleFiles,
  issue: Issue,
  issueFolderId: string,
): Promise<string | null> {
  let current = (await setup.issues.findById(issue.id))?.groupsFolderId ?? null
  if (current !== null) {
    let presence = await setup.folders(accessToken).presence(current)
    if (presence === 'exists') return current
    if (presence === 'gone') {
      logDriveFailure('an artwork group was not created', `the groups folder ${current} is gone`)
    }
    return null
  }
  let key = groupsFolderKey(issue.id)
  let tagged = await files.findTagged(issueFolderId, key)
  if (tagged === null) return null
  let id = tagged[0]
  if (id === undefined) {
    let made = await files.createFolder(issueFolderId, GROUPS_FOLDER_NAME, key)
    if (!made.ok) return null
    id = made.id
  }
  await setup.issues.setGroupsFolder(issue.id, id)
  return id
}

/** The group folder with `Obrazová díla` and `Licence` in it, and `_meta.json`, each ID stored at once. */
async function makeFiles(
  setup: GroupSetup,
  files: ArticleFiles,
  attempt: GroupRow,
  issue: Issue,
  issueFolderId: string,
  groupsFolderId: string,
): Promise<boolean> {
  let folder = await files.createFolder(groupsFolderId, attempt.name, attempt.formKey)
  if (!folder.ok) return false
  await setup.groups.setDriveId(attempt.id, 'folder', folder.id)

  let artworksFolder = await files.createFolder(folder.id, ARTWORKS_FOLDER_NAME, attempt.formKey)
  if (!artworksFolder.ok) return false
  await setup.groups.setDriveId(attempt.id, 'artworks-folder', artworksFolder.id)

  let licencesFolder = await files.createFolder(folder.id, LICENCES_FOLDER_NAME, attempt.formKey)
  if (!licencesFolder.ok) return false
  await setup.groups.setDriveId(attempt.id, 'licences-folder', licencesFolder.id)

  let meta = groupMeta({
    groupFolderId: folder.id,
    issue: issue.name,
    issueFolderId,
    name: attempt.name,
    note: attempt.note,
  })
  let metaFile = await files.uploadJson(folder.id, META_FILE_NAME, meta, attempt.formKey)
  if (!metaFile.ok) return false
  await setup.groups.setDriveId(attempt.id, 'meta', metaFile.id)
  return true
}

/**
 * Puts every file of a failed attempt in the bin and removes its row, which frees its name. The
 * stored IDs cover what Drive answered; the form key on each file covers a reply lost on the way
 * back. When Drive does not answer even this, the row stays marked and the cleanup is tried again.
 */
async function cleanUp(
  setup: GroupSetup,
  files: ArticleFiles,
  attempt: GroupRow,
  groupsFolderId: string | null,
): Promise<boolean> {
  let current = (await setup.groups.findByFormKey(attempt.formKey)) ?? attempt
  let ids = new Set(
    [
      current.metaFileId,
      current.licencesFolderId,
      current.artworksFolderId,
      current.folderId,
    ].filter((id): id is string => id !== null),
  )
  let isComplete = true

  /* What carries the key in `Skupiny obrazových děl` is the attempt's folder; what is inside it is
     looked for there. */
  let groupFolders = new Set(current.folderId === null ? [] : [current.folderId])
  if (groupsFolderId !== null) {
    let tagged = await files.findTagged(groupsFolderId, attempt.formKey)
    if (tagged === null) isComplete = false
    else for (let id of tagged) groupFolders.add(id)
  }
  for (let folderId of groupFolders) {
    ids.add(folderId)
    let tagged = await files.findTagged(folderId, attempt.formKey)
    if (tagged === null) isComplete = false
    else for (let id of tagged) ids.add(id)
  }

  for (let id of ids) {
    if (!(await files.trash(id))) isComplete = false
  }

  if (isComplete) await setup.groups.discard(current.id)
  else await setup.groups.markForCleanup(current.id, setup.now())
  return isComplete
}

/** The attempts whose cleanup failed before; another form's only while its key is free. */
async function cleanUpPending(
  setup: GroupSetup,
  files: ArticleFiles,
  ownFormKey: string | null,
): Promise<void> {
  for (let attempt of await setup.groups.pendingCleanups()) {
    if (attempt.formKey === ownFormKey) await cleanUpMarked(setup, files, attempt)
    else await lock.ifFree(`group:${attempt.formKey}`, () => cleanUpMarked(setup, files, attempt))
  }
}

async function cleanUpMarked(
  setup: GroupSetup,
  files: ArticleFiles,
  attempt: GroupRow,
): Promise<void> {
  let current = await setup.groups.findByFormKey(attempt.formKey)
  if (
    current === null ||
    current.id !== attempt.id ||
    current.createdAt !== null ||
    current.cleanupAt === null
  ) {
    return
  }
  let issue = await setup.issues.findById(current.issueId)
  await cleanUp(setup, files, current, issue?.groupsFolderId ?? null)
}

/**
 * At startup, before the port opens: every uncommitted attempt is one a crash or a failed cleanup
 * left behind. Each is marked first, so that without a connected account, or with Drive down, the
 * next group cleans it up.
 */
export async function cleanUpAbandonedGroups(setup: GroupSetup): Promise<void> {
  let abandoned = await setup.groups.abandonedAttempts()
  if (abandoned.length === 0) return
  for (let attempt of abandoned) {
    if (attempt.cleanupAt === null) await setup.groups.markForCleanup(attempt.id, setup.now())
  }
  let token = await setup.token()
  if (!token.ok) return
  await cleanUpPending(setup, setup.files(token.accessToken), null)
}
