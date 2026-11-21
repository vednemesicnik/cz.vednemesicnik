/**
 * The queue _Ke kontrole_ (`13a`–`13c`): the replies that are not exactly „Souhlasím“, and the
 * archives that failed after a consent, of artworks and of articles' final versions alike. The
 * words are the drawing's, settled by the copywriter (`satqkmyq`, `kj20mhjv`, `bn9dbz05`,
 * `ey9bfcxx`).
 */

import { APPROVAL_SEND_JOB_NAME } from './approvals.ts'
import { artworksCount } from './artwork.ts'
import type { JobHealth } from './job-run.ts'
import { REPLY_CHECK_JOB_NAME } from './reply-check.ts'
import {
  atTime,
  clockTime,
  formatDate,
  formatDay,
  formatDayMonth,
  formatMoment,
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
 * The line under the title (`13a`, `13c`), in three parts so the page can link the middle one to
 * _Úlohy na pozadí_: the whole sentence of a job that is not reading the replies, the job's name
 * when it never reported. When the replies were read, nothing is linked.
 */
export type ReadLine = { after: string; before: string; link: string | null }

/** The two jobs that read the replies the queue holds: the artworks' and the articles'. */
export type ReadingJobs = { articles: JobHealth; artworks: JobHealth }

/* `13c`, and the copywriter's lines for a job that is _Neběží_ (`ey9bfcxx`). */
const ARTWORKS_STOPPED = tied`Čtení odpovědí k obrazovým dílům teď neběží.`
const ARTICLES_STOPPED = tied`Čtení odpovědí u článků teď neběží.`
const BOTH_STOPPED = tied`Čtení odpovědí u článků i obrazových děl teď neběží.`
const NONE_REPORTED = tied`Žádná z úloh pro čtení odpovědí se zatím neohlásila.`

/**
 * One line for the two jobs. A job that is _Neběží_ wins over one that never reported, because it
 * stopped doing what it did; one that never reported is named, because the queue may be empty for
 * that reason alone. Two jobs that both report give the older of their last runs, which is true
 * of both, and the estimate only when it is the same for both: one job's next run reads none of
 * the other's replies. Whether the line should be two, one per kind, is a question for design.
 */
export function readLine(jobs: ReadingJobs, today: Temporal.Instant): ReadLine {
  let { articles, artworks } = jobs
  if (artworks.kind === 'stopped' && articles.kind === 'stopped') {
    return { after: '', before: '', link: BOTH_STOPPED }
  }
  if (artworks.kind === 'stopped') return { after: '', before: '', link: ARTWORKS_STOPPED }
  if (articles.kind === 'stopped') return { after: '', before: '', link: ARTICLES_STOPPED }
  if (artworks.kind === 'never' && articles.kind === 'never') {
    return { after: '', before: '', link: NONE_REPORTED }
  }
  if (artworks.kind === 'never') {
    return { after: ' se zatím neohlásila.', before: 'Úloha ', link: REPLY_CHECK_JOB_NAME }
  }
  if (articles.kind === 'never') {
    return { after: ' se zatím neohlásila.', before: 'Úloha ', link: APPROVAL_SEND_JOB_NAME }
  }
  let isArtworksOlder =
    Temporal.Instant.compare(artworks.lastStartedAt, articles.lastStartedAt) <= 0
  let lastStartedAt = isArtworksOlder ? artworks.lastStartedAt : articles.lastStartedAt
  let next =
    artworks.next !== null &&
    articles.next !== null &&
    Temporal.Instant.compare(artworks.next, articles.next) === 0
      ? artworks.next
      : null
  let day = formatDay(lastStartedAt, today)
  let read =
    day === 'dnes'
      ? `Odpovědi čteny ${atTime(lastStartedAt)}`
      : `Odpovědi čteny ${formatMoment(lastStartedAt, today)}`
  let text = next === null ? read : `${read} · další běh kolem ${clockTime(next)}`
  return { after: '', before: text, link: null }
}

/* `13c`, the empty queue. */
export const EMPTY_TITLE = 'Nic ke kontrole'
export const EMPTY_TEXT = tied`Všechny odpovědi byly přesně „Souhlasím“, nebo jste o nich už rozhodli. Kde co čeká na souhlas, ukazuje detail vydání.`
export const EMPTY_ACTION = 'Přejít na vydání'
