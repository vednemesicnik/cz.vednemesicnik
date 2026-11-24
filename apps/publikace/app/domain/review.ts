/**
 * The queue _Ke kontrole_ (`13a`–`13c`): the replies that are not exactly „Souhlasím“, and the
 * archives that failed after a consent, of artworks and of articles' final versions alike. The
 * words are the drawing's, settled by the copywriter (`satqkmyq`, `kj20mhjv`, `bn9dbz05`,
 * `ey9bfcxx`).
 */

import { APPROVAL_SEND_JOB, APPROVAL_SEND_JOB_NAME } from './approvals.ts'
import { artworksCount } from './artwork.ts'
import type { JobHealth, JobState } from './job-run.ts'
import { REPLY_CHECK_JOB, REPLY_CHECK_JOB_NAME } from './reply-check.ts'
import {
  clockTime,
  formatDate,
  formatDayMonth,
  formatMoment,
  fromMoment,
  pragueYear,
} from './time.ts'
import { tied } from './public/typography.ts'

export const REVIEW_TITLE = 'Ke kontrole'
export const REVIEW_LEAD = tied`Odpovědi, které systém nepoznal jako souhlas. Přečtěte je a rozhodněte.`

/** `Obrazová díla · 2 díla · VDM_2026_5`. */
export function kindLine(artworks: number, issueName: string): string {
  return `Obrazová díla · ${artworksCount(artworks)} · ${issueName}`
}

/** `Finální verze článku · VDM_2026_5` (`13a`). */
export function articleKindLine(issueName: string): string {
  return `Finální verze článku · ${issueName}`
}

/** `Klára Šimková · klara.simkova@external.test · přijato 14. 11. v 7:12` (`13a`, `satqkmyq`). */
export function receivedLine(
  name: string,
  email: string,
  receivedAt: Temporal.Instant,
  today: Temporal.Instant,
): string {
  return `${name} · ${email} · přijato ${formatMoment(receivedAt, today)}`
}

/** `Klára Šimková · souhlas zaznamenán 14. 11. v 7:20` (`13c`). */
export function verifiedLine(
  name: string,
  verifiedAt: Temporal.Instant,
  today: Temporal.Instant,
): string {
  return `${name} · souhlas zaznamenán ${formatMoment(verifiedAt, today)}`
}

/** `Klára Šimková · odpověď „ok, souhlas“` on the card that has just been decided (`13b`). */
export function settledLine(name: string, excerpt: string): string {
  return `${name} · odpověď „${excerpt}“`
}

export const CONSENT_LABEL = 'Je to souhlas'
export const UNDO_LABEL = 'Vrátit'
export const SHOW_ARTWORKS_LABEL = 'Zobrazit díla'
export const SHOW_WHOLE_REPLY_LABEL = 'Zobrazit celou odpověď'

/** The name in brackets in its first case: the app does not decline a name (`zoy6ixjt`). */
export function replyMenuLabel(name: string): string {
  return `Další akce pro odpověď (${name})`
}

/** A quote this long is cut at twelve lines, with the rest one click away. */
export const QUOTE_LINES = 12
const QUOTE_CHARACTERS = 900

export function isLongReply(text: string): boolean {
  return text.split('\n').length > QUOTE_LINES || text.length > QUOTE_CHARACTERS
}

/* `13b`: the tag of the card after _Je to souhlas_, and its line. */
export const VERIFIED_TAG = 'Souhlas zaznamenán'
export function verifiedTagDetail(health: JobHealth): string {
  return health.kind === 'stopped' ? 'úloha teď neběží' : 'čeká na uložení'
}

/** The toast after _Je to souhlas_: the estimate only while there is one (`13b`, `13c`). */
export function verifiedToast(health: JobHealth): string {
  if (health.kind === 'stopped') return 'Konverzace čeká na uložení. Úloha teď neběží.'
  if (health.kind === 'running' && health.next !== null) {
    return tied`Souhlas zaznamenán. Pokus o uložení konverzace proběhne kolem ${clockTime(health.next)}.`
  }
  return 'Souhlas zaznamenán. Konverzace čeká na uložení.'
}

/* `13c`: a consent whose conversation the job could not archive. */
export const ARCHIVE_FAILED_TAG = 'Chyba'
export const ARCHIVE_STOPPED_TITLE = `Zkontrolujte úlohu ${REPLY_CHECK_JOB_NAME}`
/** The same title on an article's card, naming its own job (`ey9bfcxx`): no quotes, as above. */
export const ARTICLE_ARCHIVE_STOPPED_TITLE = `Zkontrolujte úlohu ${APPROVAL_SEND_JOB_NAME}`

export function archiveFailedText(health: JobHealth): string {
  if (health.kind === 'stopped') {
    return tied`Souhlas platí. Konverzaci se nepodařilo uložit do složky Licence a úloha, která to zkusí znovu, teď neběží.`
  }
  if (health.kind === 'running' && health.next !== null) {
    return tied`Souhlas platí. Konverzaci se nepodařilo uložit do složky Licence. Další pokus o uložení proběhne kolem ${clockTime(health.next)}.`
  }
  return tied`Souhlas platí. Konverzaci se nepodařilo uložit do složky Licence. Další pokus o uložení proběhne při dalším běhu úlohy.`
}

/* `13g`: a reply to a batch the editors-in-chief discarded. */
export function discardedBatchText(discardedAt: Temporal.Instant, today: Temporal.Instant): string {
  return tied`Dávka je od ${dateOf(discardedAt, today)} zahozená. Díla i jejich PDF jsou v koši sdíleného disku Publikace. Volbou „Je to souhlas“ uložíte konverzaci do složky Licence. Díla zůstanou mimo vydání.`
}

function dateOf(instant: Temporal.Instant, today: Temporal.Instant): string {
  return pragueYear(instant) === pragueYear(today) ? formatDayMonth(instant) : formatDate(instant)
}

/**
 * One part of a job's line over the queue (`13i`): words around one link at most. The page keeps
 * a part together and breaks the line between parts, at „·“, unless a part alone is wider than
 * the screen.
 */
export type ReadPart = { after: string; before: string; link: string | null }

/**
 * A line of the header over the queue, one a job (`13a`, `13i`, `13c`). `job` is the job whose
 * page the link opens, when its last run failed (`14e`); a sentence about a job that stopped or
 * never reported links to the list of jobs (`14d`), as `job: null`.
 */
export type ReadLine = { job: string | null; parts: readonly ReadPart[] }

/** The two jobs that read the replies the queue holds: the artworks' and the articles'. */
export type ReadingJobs = { articles: JobState; artworks: JobState }

/**
 * What a screen reader calls the header's list: _Stav_, so it is not heard as a task beside the
 * lead's _Přečtěte je_ (copy `9gje14lt`).
 */
export const READ_LIST_LABEL = 'Stav čtení odpovědí'

/* `13c`, and the copywriter's lines for a job that is _Neběží_ (`ey9bfcxx`). */
const ARTWORKS_STOPPED = tied`Čtení odpovědí k obrazovým dílům teď neběží.`
const ARTICLES_STOPPED = tied`Čtení odpovědí u článků teď neběží.`
const BOTH_STOPPED = tied`Čtení odpovědí u článků i obrazových děl teď neběží.`
const NONE_REPORTED = tied`Žádná z úloh pro čtení odpovědí se zatím neohlásila.`

type ReadingKind = Exclude<ReviewKind, 'all'>

/** Each kind's job, named by the filter's word, in the filter's order (`13i`). */
const READING: Readonly<
  Record<ReadingKind, { job: string; label: string; name: string; stopped: string }>
> = {
  articles: {
    job: APPROVAL_SEND_JOB,
    label: 'Články:',
    name: APPROVAL_SEND_JOB_NAME,
    stopped: ARTICLES_STOPPED,
  },
  artworks: {
    job: REPLY_CHECK_JOB,
    label: 'Obrazová díla:',
    name: REPLY_CHECK_JOB_NAME,
    stopped: ARTWORKS_STOPPED,
  },
}

function sentence(text: string): ReadLine {
  return { job: null, parts: [{ after: '', before: '', link: text }] }
}

/**
 * A job's line: how its last read ended, with the time it started (`4k262ttk`). _dokončeno_ only
 * after a run that reported its end without an error, so it never stands over a run that read
 * nothing. A run that did not report its end within the limit is _zatím bez výsledku_ and not an
 * error, because only a reported end knows of one; both send the reader to the job's page.
 */
function jobLine(kind: ReadingKind, state: JobState, today: Temporal.Instant): ReadLine {
  let { job, label, name, stopped } = READING[kind]
  switch (state.kind) {
    case 'stopped':
      return sentence(stopped)
    case 'never':
      return {
        job: null,
        parts: [{ after: ' se zatím neohlásila.', before: 'Úloha ', link: name }],
      }
    case 'running':
      return {
        job: null,
        parts: [{ after: '', before: `${label} probíhá čtení odpovědí`, link: null }],
      }
    case 'ok':
    case 'failed': {
      let read = `čtení ${fromMoment(state.lastStartedAt, today)}`
      let first: ReadPart =
        state.kind === 'ok'
          ? { after: '', before: `${label} ${read} dokončeno`, link: null }
          : {
              after: '',
              before: `${label} `,
              link: `${read} ${state.isUnreported ? 'zatím bez výsledku' : 'skončilo chybou'}`,
            }
      let parts =
        state.next === null
          ? [first]
          : [first, { after: '', before: `další běh kolem ${clockTime(state.next)}`, link: null }]
      return { job: state.kind === 'failed' ? job : null, parts }
    }
  }
}

/**
 * The header over the queue (`13i`): a line a job, so the reader sees for which kind a reply may
 * be missing and when to look again, since two estimates hardly ever meet. Under one kind of the
 * filter only that kind's line, which describes the list under it. Two jobs that both stopped, or
 * that both never reported, share one sentence, as `13c` has it.
 */
export function readLines(
  jobs: ReadingJobs,
  kind: ReviewKind,
  today: Temporal.Instant,
): ReadLine[] {
  if (kind !== 'all') return [jobLine(kind, jobs[kind], today)]
  let { articles, artworks } = jobs
  if (articles.kind === 'stopped' && artworks.kind === 'stopped') return [sentence(BOTH_STOPPED)]
  if (articles.kind === 'never' && artworks.kind === 'never') return [sentence(NONE_REPORTED)]
  return [jobLine('articles', articles, today), jobLine('artworks', artworks, today)]
}

/* `13a`, the filter over the queue, in the address as `?kind=`. */
export type ReviewKind = 'all' | 'articles' | 'artworks'

export const REVIEW_KINDS: readonly { label: string; value: ReviewKind }[] = [
  { label: 'Vše', value: 'all' },
  { label: 'Články', value: 'articles' },
  { label: 'Obrazová díla', value: 'artworks' },
]

/** The accessible name of the filter, which narrows kinds where the others narrow states. */
export const REVIEW_KINDS_LABEL = 'Druh položky'

/** A missing or unknown `?kind=` is _Vše_, as `?artworks=` is in the issue detail. */
export function reviewKindOf(value: string | null): ReviewKind {
  return REVIEW_KINDS.some((kind) => kind.value === value) ? (value as ReviewKind) : 'all'
}

/*
 * A kind filtered to nothing while the other still has cards, which `13c` does not draw
 * (`ivq7pax9`). It speaks of items, not replies: a card whose archive failed is counted too, and
 * its consent is no longer a reply to decide.
 */
export function emptyKindTitle(kind: Exclude<ReviewKind, 'all'>): string {
  return kind === 'articles' ? tied`U článků tu nic není` : tied`U obrazových děl tu nic není`
}

export function otherKindText(count: number): string {
  return `Filtr Vše ukáže ${itemsCount(count)}.`
}

/** `1 položku`, `2 položky`, `5 položek`, as the object of _ukáže_. */
function itemsCount(count: number): string {
  if (count === 1) return '1 položku'
  return count >= 2 && count <= 4 ? `${count} položky` : `${count} položek`
}

export const SHOW_ALL_LABEL = 'Zobrazit vše'

/* `13c`, the empty queue. */
export const EMPTY_TITLE = 'Nic ke kontrole'
export const EMPTY_TEXT = tied`Všechny odpovědi byly přesně „Souhlasím“, nebo jste o nich už rozhodli. Kde co čeká na souhlas, ukazuje detail vydání.`
export const EMPTY_ACTION = 'Přejít na vydání'
