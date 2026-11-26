/**
 * The words `12j` gives an issue whose own folder is missing: `Články`, which the newsroom's link
 * needs, or the whole issue folder (#134). The toasts after _Zkontrolovat znovu_ are an article
 * folder's, in `article-folders.ts`.
 */

import type { Issue, IssueFolderKind } from './issue.ts'
import { atTime, formatDayMonth } from './time.ts'
import { tied } from './public/typography.ts'

export const ARTICLES_LINK_STOPPED_TEXT = tied`Z odkazu pro redakci teď nejde založit článek.`
export const ISSUE_LINKS_STOPPED_TEXT = tied`Z odkazů tohoto vydání teď nejde založit článek ani odeslat díla.`

/**
 * The one mark the detail shows. With the issue folder in the bin, that one alone: everything in
 * it comes back with it, and the bin shows only the folder somebody put there (`12j`).
 */
export function shownIssueMark(
  issue: Pick<Issue, 'missing'>,
): { at: Temporal.Instant; kind: IssueFolderKind } | null {
  if (issue.missing.issue !== null) return { at: issue.missing.issue, kind: 'issue' }
  if (issue.missing.articles !== null) return { at: issue.missing.articles, kind: 'articles' }
  return null
}

/** The step, which names the folder by the issue's name, as the bin shows it. */
export function issueFolderHeading(kind: IssueFolderKind, name: string): string {
  return kind === 'issue'
    ? tied`Obnovte složku vydání ${name} z koše, nebo ji vraťte na sdílený disk Publikace.`
    : tied`Obnovte složku Články vydání ${name} z koše, nebo ji vraťte na sdílený disk Publikace.`
}

/** What the issue's links cannot do and when the app found it. */
export function issueFolderText(kind: IssueFolderKind, foundAt: Temporal.Instant): string {
  let stopped = kind === 'issue' ? ISSUE_LINKS_STOPPED_TEXT : ARTICLES_LINK_STOPPED_TEXT
  return `${stopped} Zjištěno ${formatDayMonth(foundAt)} ${atTime(foundAt)}.`
}
