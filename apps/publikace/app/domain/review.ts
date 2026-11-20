/**
 * The queue _Ke kontrole_ (`13a`–`13c`): the replies that are not exactly „Souhlasím“, and the
 * archives that failed after a consent. The words are the drawing's, settled by the copywriter
 * (`satqkmyq`, `kj20mhjv`, `bn9dbz05`).
 */

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

export const REVIEW_TITLE = 'Ke kontrole'
export const REVIEW_LEAD = 'Odpovědi, které systém nepoznal jako souhlas. Přečtěte je a rozhodněte.'

/** `Obrazová díla · 2 díla · VDM_2026_5`. */
export function kindLine(artworks: number, issueName: string): string {
  return `Obrazová díla · ${artworksCount(artworks)} · ${issueName}`
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
    return `Souhlas zaznamenán. Pokus o uložení konverzace proběhne kolem ${clockTime(health.next)}.`
  }
  return 'Souhlas zaznamenán. Konverzace čeká na uložení.'
}

/* `13c`: a consent whose conversation the job could not archive. */
export const ARCHIVE_FAILED_TAG = 'Chyba'
export const ARCHIVE_STOPPED_TITLE = `Zkontrolujte úlohu ${REPLY_CHECK_JOB_NAME}`

export function archiveFailedText(health: JobHealth): string {
  if (health.kind === 'stopped') {
    return 'Souhlas platí. Konverzaci se nepodařilo uložit do složky Licence a úloha, která to zkusí znovu, teď neběží.'
  }
  if (health.kind === 'running' && health.next !== null) {
    return `Souhlas platí. Konverzaci se nepodařilo uložit do složky Licence. Další pokus o uložení proběhne kolem ${clockTime(health.next)}.`
  }
  return 'Souhlas platí. Konverzaci se nepodařilo uložit do složky Licence. Další pokus o uložení proběhne při dalším běhu úlohy.'
}

/* `13g`: a reply to a batch the editors-in-chief discarded. */
export function discardedBatchText(discardedAt: Temporal.Instant, today: Temporal.Instant): string {
  return `Dávka je od ${dateOf(discardedAt, today)} zahozená. Díla i jejich PDF jsou v koši sdíleného disku Publikace. Volbou „Je to souhlas“ uložíte konverzaci do složky Licence. Díla zůstanou mimo vydání.`
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

export function readLine(health: JobHealth, today: Temporal.Instant): ReadLine {
  if (health.kind === 'never') {
    return { after: ' se zatím neohlásila.', before: 'Úloha ', link: REPLY_CHECK_JOB_NAME }
  }
  if (health.kind === 'stopped') {
    return { after: '', before: '', link: 'Čtení odpovědí k obrazovým dílům teď neběží.' }
  }
  let day = formatDay(health.lastStartedAt, today)
  let read =
    day === 'dnes'
      ? `Odpovědi čteny ${atTime(health.lastStartedAt)}`
      : `Odpovědi čteny ${formatMoment(health.lastStartedAt, today)}`
  let text = health.next === null ? read : `${read} · další běh kolem ${clockTime(health.next)}`
  return { after: '', before: text, link: null }
}

/* `13c`, the empty queue. */
export const EMPTY_TITLE = 'Nic ke kontrole'
export const EMPTY_TEXT =
  'Všechny odpovědi byly přesně „Souhlasím“, nebo jste o nich už rozhodli. Kde co čeká na souhlas, ukazuje detail vydání.'
export const EMPTY_ACTION = 'Přejít na vydání'
