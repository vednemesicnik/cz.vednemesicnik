/**
 * The print folder of an issue made in the app (#110, `12t`): `_Podklady_pro_tisk`, which
 * `SCRIPT__Publication__Print_Handoff` fills with copies of the approved texts and of the artworks
 * with consent. The job claims what belongs there through the app's API and reports what it
 * copied; the app keeps the copies and says in the issue detail how fresh the folder is and how
 * much it holds. The wording went through the copywriter (`84m2ye59`) and stands in the drawing
 * (`12a`, `12t`).
 */

import type { JobState } from './job-run.ts'
import { RUN_LIMIT_MINUTES } from './job-run.ts'
import { atTime, clockTime, formatDate, formatDayMonth, formatDay, pragueYear } from './time.ts'
import { NBSP, tied } from './public/typography.ts'

/** The job, as `job_runs` names it, and what a person reads of it (`14d`). */
export const PRINT_HANDOFF_JOB = 'print-handoff'
export const PRINT_HANDOFF_JOB_NAME = 'Podklady pro tisk'
export const PRINT_HANDOFF_SUMMARY = tied`schválené texty a díla do složky pro grafika`

/** An issue claimed this recently is not handed to another run: one run lasts ten minutes at most. */
export const CLAIM_MINUTES = RUN_LIMIT_MINUTES

/**
 * The issues one run may take. A run stops after four and a half minutes and the next one carries
 * on, so a claim never needs more than the open issues of a few months.
 */
export const ISSUE_CLAIM_LIMIT = 20

/** More than any error text a run reports; the rest is cut. */
export const ERROR_TEXT_LIMIT = 2000

/**
 * The key in a copy's `appProperties` that names what it is a copy of. Before it copies, the job
 * looks in the print folder for a file with that tag and takes it, so a run that died between
 * copying and reporting does not leave a second copy beside the first.
 */
export const COPY_PROPERTY = 'publikaceHandoff'

/** The tag of an article's folder inside the print folder. */
export function articleFolderTag(articleId: number): string {
  return `article_${articleId}`
}

/** The tag of an artwork group's folder inside the print folder (#133). */
export function groupFolderTag(groupId: number): string {
  return `group_${groupId}`
}

/** The tag of the copy of one approved final version of an article. */
export function textCopyTag(articleId: number, finalVersionId: number): string {
  return `text_${articleId}_${finalVersionId}`
}

/** The tag of the copy of one artwork. */
export function artworkCopyTag(artworkId: number): string {
  return `artwork_${artworkId}`
}

/** The job's words when a run fails (`14e`, `14i`), from the copywriter (`84m2ye59`). */
export const PRINT_HANDOFF_FAILED_CALLOUT = tied`Úloha skončila s chybou. V podkladech pro tisk mohou chybět některé schválené texty nebo díla.`
export const PRINT_HANDOFF_FAILED_EVENT = 'Skončila s chybou'
export const PRINT_HANDOFF_BANNER = tied`Podklady pro tisk se teď nemusí doplňovat o nově schválené texty a díla.`

export const PRINT_SECTION_TITLE = 'Podklady pro tisk'

/** What the print folder holds, as the last run that got through the whole issue reported it. */
export type PrintSummary = { artworks: number; filledAt: Temporal.Instant; texts: number }

/** _1 text_, _2 texty_, _5 textů_ — the form follows each number on its own (`12t`). */
function textsCount(count: number): string {
  if (count === 1) return '1 text'
  if (count >= 2 && count <= 4) return `${count} texty`
  return `${count} textů`
}

/** _1 dílo_, _2 díla_, _5 děl_. */
function artworksCount(count: number): string {
  if (count === 1) return '1 dílo'
  if (count >= 2 && count <= 4) return `${count} díla`
  return `${count} děl`
}

/** A part of the line keeps its words together; the line breaks only between parts (`12t`). */
function unbroken(text: string): string {
  return text.replaceAll(' ', NBSP)
}

/**
 * What the folder holds: an empty kind is left out, and an empty folder says so in words rather
 * than in two zeros (`84m2ye59`).
 */
export function contentsText(texts: number, artworks: number): string {
  if (texts === 0 && artworks === 0) return 'Zatím žádné texty ani díla'
  if (texts === 0) return artworksCount(artworks)
  if (artworks === 0) return textsCount(texts)
  return `${textsCount(texts)} a ${artworksCount(artworks)}`
}

/**
 * _poslední celý běh dnes v 6:00_, _13. 11. v 6:00_ on another day, with the year in another
 * year. _Celý_ because a run cut short does not move it, and not _doplněno_, because a run that
 * added nothing did not fill anything (`84m2ye59`).
 */
export function lastFullRunText(filledAt: Temporal.Instant, today: Temporal.Instant): string {
  let day =
    formatDay(filledAt, today) === 'dnes'
      ? 'dnes'
      : pragueYear(filledAt) === pragueYear(today)
        ? formatDayMonth(filledAt)
        : formatDate(filledAt)
  return `poslední celý běh ${day} ${atTime(filledAt)}`
}

/** The last part of the line: what the job does now. Its links lead to the job's history (14e). */
export type PrintJobPart = { isLink: boolean; text: string }

/**
 * _úloha teď neběží_ beats an error, which beats the estimate, as the tag in `14d` does. While a
 * run is under way, or once the estimate passed, nothing: a run in progress promises nothing.
 */
export function jobPart(state: JobState): PrintJobPart | null {
  switch (state.kind) {
    case 'stopped':
      return { isLink: true, text: unbroken('úloha teď neběží') }
    case 'failed':
      return { isLink: true, text: unbroken('chyba při běhu úlohy') }
    case 'ok':
      return state.next === null
        ? null
        : { isLink: false, text: unbroken(`další běh kolem ${clockTime(state.next)}`) }
    case 'never':
    case 'running':
      return null
  }
}

/**
 * The line under _Podklady pro tisk_ (`12t`): its parts, joined by „·“ at the end of a line. A job
 * that never reported has one sentence and no link. Before a run got through the whole issue, a
 * sentence takes the place of the count and the time, and loses its full stop when the job's part
 * follows it.
 */
export type PrintLine = { job: PrintJobPart | null; lead: string[] }

export function printLine(
  summary: PrintSummary | null,
  state: JobState,
  today: Temporal.Instant,
): PrintLine {
  if (state.kind === 'never') return { job: null, lead: [tied`Úloha se zatím neohlásila.`] }
  let job = jobPart(state)
  if (summary === null) {
    let sentence = tied`Úloha tímto vydáním zatím neprošla celým`
    return { job, lead: [job === null ? `${sentence}.` : sentence] }
  }
  return {
    job,
    lead: [
      unbroken(contentsText(summary.texts, summary.artworks)),
      unbroken(lastFullRunText(summary.filledAt, today)),
    ],
  }
}
