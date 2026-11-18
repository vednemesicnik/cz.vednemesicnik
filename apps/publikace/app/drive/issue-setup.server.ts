import type { IssueStore } from '../data/issues.server.ts'
import {
  ARTICLES_FOLDER_NAME,
  type FolderKind,
  type Issue,
  issueNameKey,
  missingFolders,
  PRINT_FOLDER_NAME,
} from '../domain/issue.ts'
import type { DriveAccessToken } from './access-token.server.ts'
import type { DriveFolders } from './folders.server.ts'
import { logDriveFailure } from './log.server.ts'
import { createLock } from './one-at-a-time.server.ts'

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
