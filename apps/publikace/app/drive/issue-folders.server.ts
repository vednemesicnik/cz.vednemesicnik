import type { IssueStore } from '../data/issues.server.ts'
import type { Issue, IssueFolderKind } from '../domain/issue.ts'
import type { DriveFolders, FolderStanding } from './folders.server.ts'

/**
 * Whether the issue folder and `Články` in it are where the app left them, and the record of it on
 * the issue (`12j`, #134). The newsroom's link page asks here when it opens and when its form is
 * sent, and the issue detail when it opens and on _Zkontrolovat znovu_. A folder found missing is
 * marked, one found again loses its mark, and neither is ever created again.
 */

export type IssueFoldersDeps = {
  folders: Pick<DriveFolders, 'standing'>
  issues: Pick<IssueStore, 'clearMissing' | 'markMissing'>
  now(): Temporal.Instant
}

export type IssueFolderCheck = { missing: IssueFolderKind[] } | 'unavailable'

export const ISSUE_FOLDERS: readonly IssueFolderKind[] = ['issue', 'articles']

/**
 * The issue's folders that are missing, by the rule an article's folders follow. `Články` comes
 * first, because the link needs it and it is there in nearly every check; only when it is not is
 * the issue folder asked too. With the issue folder in the bin, `Články` counts only when it is
 * missing on its own: one that is there only with its parent comes back with it, and the bin shows
 * only the topmost folder somebody put there, the one `12j` names. An issue folder in the bin
 * only with the issues folder above it is still the topmost folder the app knows, so it is the
 * one marked. When Drive does not answer, nothing is recorded.
 */
export async function checkIssueFolders(
  deps: IssueFoldersDeps,
  issue: Pick<Issue, 'folderIds' | 'id'>,
): Promise<IssueFolderCheck> {
  let articles = await standingOf(deps, issue.folderIds.articles)
  if (articles === 'unavailable') return 'unavailable'

  let missing: IssueFolderKind[] = []
  if (articles !== 'exists') {
    let parent = await standingOf(deps, issue.folderIds.issue)
    if (parent === 'unavailable') return 'unavailable'
    let isIssueMissing = parent !== 'exists'
    if (isIssueMissing) missing.push('issue')
    if (!isIssueMissing || articles === 'gone') missing.push('articles')
  }

  let found = ISSUE_FOLDERS.filter((kind) => !missing.includes(kind))
  if (missing.length > 0) await deps.issues.markMissing(issue.id, missing, deps.now())
  if (found.length > 0) await deps.issues.clearMissing(issue.id, found)
  return { missing }
}

/** A folder whose ID was never stored is missing without asking Drive. */
function standingOf(deps: IssueFoldersDeps, folderId: string | null): Promise<FolderStanding> {
  return folderId === null ? Promise.resolve('gone') : deps.folders.standing(folderId)
}

/** The kinds the issue has on record as missing. */
export function recordedIssueMissing(issue: Pick<Issue, 'missing'>): IssueFolderKind[] {
  return ISSUE_FOLDERS.filter((kind) => issue.missing[kind] !== null)
}
