/**
 * Artworks (_obrazová díla_) and their batches: the limits of the link, the subject the reply
 * check pairs by, the state `01b` gives a batch, and the words `21c`, `21d`, `02f` and `12a`
 * give them, as the copywriter settled them (`zoy6ixjt`). The form's rules are in
 * `public/artwork-form.ts`, which the browser loads too.
 */

import { formatDayMonth } from './time.ts'

export { SUBMISSIONS_PER_HOUR as SUBMITS_PER_HOUR } from './article.ts'

/**
 * Sixty uploads in the last sixty minutes through one link, every upload the server stored:
 * sent, unsent, removed and unreadable alike (`21b`, `mpz96z33`). A cap on unsent files alone is
 * beaten by uploading and removing, and a removed file still takes room in the bin.
 */
export const UPLOADS_PER_HOUR_PER_LINK = 60

/** Five distinct addresses a link's consent requests went to in the last 24 hours (`21d`). */
export const RECIPIENTS_PER_DAY_PER_LINK = 5

/** The e-mails public pages and resends may start in a day, unless `PUBLIC_MAIL_PER_DAY` says. */
export const DEFAULT_PUBLIC_MAIL_PER_DAY = 300

/** An upload never sent goes to the bin this long after it was uploaded (`21d`). */
export const UNSENT_UPLOAD_HOURS = 24

function startsWith(bytes: Uint8Array, offset: number, expected: readonly number[]): boolean {
  return expected.every((byte, index) => bytes[offset + index] === byte)
}

function ascii(text: string): number[] {
  return [...text].map((character) => character.charCodeAt(0))
}

/**
 * The type a file's first bytes say it is, of the allowed ones, or `null` for anything else: the
 * failed card of `21b`. What the browser claims is not trusted, since the endpoint is public.
 */
export function imageTypeOf(bytes: Uint8Array): string | null {
  if (startsWith(bytes, 0, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (startsWith(bytes, 0, ascii('GIF87a')) || startsWith(bytes, 0, ascii('GIF89a'))) {
    return 'image/gif'
  }
  if (startsWith(bytes, 0, ascii('RIFF')) && startsWith(bytes, 8, ascii('WEBP'))) {
    return 'image/webp'
  }
  if (
    startsWith(bytes, 0, [0x49, 0x49, 0x2a, 0x00]) ||
    startsWith(bytes, 0, [0x4d, 0x4d, 0x00, 0x2a])
  ) {
    return 'image/tiff'
  }
  if (startsWith(bytes, 4, ascii('ftyp'))) {
    let brand = String.fromCharCode(...bytes.slice(8, 12))
    if (['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx'].includes(brand)) return 'image/heic'
    if (['mif1', 'msf1', 'heif'].includes(brand)) return 'image/heif'
  }
  return null
}

/**
 * `20261118T134500`: the batch's tag, Prague time to the second, as the script makes it. The
 * subject ends with it in brackets, and the reply check pairs a reply by it.
 */
export function batchTag(instant: Temporal.Instant): string {
  let time = instant.toZonedDateTimeISO('Europe/Prague')
  let two = (value: number) => String(value).padStart(2, '0')
  return `${time.year}${two(time.month)}${two(time.day)}T${two(time.hour)}${two(time.minute)}${two(time.second)}`
}

/**
 * The prefix the reply check searches by and allows (`SCRIPT__Mail__Reply_Check`,
 * `allowedSubjectPrefixes`): every consent request starts with it, or its replies are never read.
 */
export const CONSENT_SUBJECT_PREFIX = 'Žádost o potvrzení souhlasu s užitím obrazových děl'

export function consentSubject(articleName: string, issueName: string, tag: string): string {
  return `${CONSENT_SUBJECT_PREFIX} ke článku „${articleName}“ – ${issueName} [${tag}]`
}

/** The Mailer's idempotency key of a batch's request: a resend from anywhere is the same e-mail. */
export function consentIdempotencyKey(formKey: string): string {
  return `artwork-consent:${formKey}`
}

/** The states of `01b` an artwork of the app can be in. */
export type ArtworkState = 'approved' | 'error' | 'provider' | 'review'

/** A committed batch, as far as its state goes: its request, the reply and what came of it. */
export type BatchStatus = {
  approvedAt: Temporal.Instant | null
  archiveFailedAt: Temporal.Instant | null
  consentVerifiedAt: Temporal.Instant | null
  discardedAt: Temporal.Instant | null
  /** The latest reply is exactly „Souhlasím“. */
  isExactConsent: boolean
  mailRefusedAt: Temporal.Instant | null
  mailSentAt: Temporal.Instant | null
  replyMessageId: string | null
  replyText: string | null
}

/**
 * Whether the reply check may archive the conversation without a person: an exact „Souhlasím“,
 * except on a discarded batch, whose every reply goes to _Ke kontrole_ (`01b`), or a decision of
 * the editors-in-chief.
 */
export function mayArchive(batch: BatchStatus): boolean {
  return batch.consentVerifiedAt !== null || (batch.isExactConsent && batch.discardedAt === null)
}

/**
 * The state of `01b`, by who is on the move.
 *
 * - _Schváleno_ once the conversation is in `Licence`; never before, since the job archives first
 *   and reports both at once.
 * - _Chyba_ when the archive failed, or while no reply came and the Mailer never confirmed the
 *   request. A reply beats the unconfirmed request: a copy that arrived after all was read
 *   (`viipe3q8`).
 * - _U poskytovatele_ after _Je to souhlas_ (stored as _Souhlas k archivaci_), after an exact
 *   „Souhlasím“ the job is about to archive, and while the request waits for an answer.
 * - _Ke kontrole_ for any other reply.
 */
export function batchState(batch: BatchStatus): ArtworkState {
  if (batch.approvedAt !== null) return 'approved'
  if (batch.archiveFailedAt !== null) return 'error'
  if (batch.replyMessageId !== null) return mayArchive(batch) ? 'provider' : 'review'
  return batch.mailSentAt === null ? 'error' : 'provider'
}

/** _Chyba_ because the request never went, where _Poslat žádost znovu_ and _Zahodit_ belong. */
export function isMailError(batch: BatchStatus): boolean {
  return batchState(batch) === 'error' && batch.archiveFailedAt === null
}

/** The first line of a reply, cut to fit under a tag: _odpověď „ok, souhlas“_ (`01b`). */
export function replyExcerpt(text: string): string {
  let line = text.trim().split('\n')[0]?.trim() ?? ''
  return line.length > 40 ? `${line.slice(0, 39).trimEnd()}…` : line
}

export const ARTWORK_STATE_LABELS: Readonly<Record<ArtworkState, string>> = {
  approved: 'Schváleno',
  error: 'Chyba',
  provider: 'U poskytovatele',
  review: 'Ke kontrole',
}

/** The line under the tag (`12a`, `01b`, `13c`). */
export function batchStateDetail(batch: BatchStatus): string {
  if (batch.approvedAt !== null) return 'konverzace v Licencích'
  if (batch.archiveFailedAt !== null) return 'konverzace se neuložila'
  if (batch.consentVerifiedAt !== null) {
    return `souhlas zaznamenán ${formatDayMonth(batch.consentVerifiedAt)}`
  }
  if (batch.replyMessageId !== null && batchState(batch) === 'review') {
    if (batch.discardedAt !== null) return `dávka zahozena ${formatDayMonth(batch.discardedAt)}`
    return `odpověď „${replyExcerpt(batch.replyText ?? '')}“`
  }
  if (batch.mailSentAt !== null) return `žádost odeslána ${formatDayMonth(batch.mailSentAt)}`
  if (batch.mailRefusedAt !== null) return 'pošta žádost trvale odmítla'
  return 'chybí potvrzení o odeslání žádosti'
}

/* `12a`, the filter over the table, in the address as `?artworks=`. */
export type ArtworkFilter = 'all' | ArtworkState

export const ARTWORK_FILTERS: readonly { label: string; value: ArtworkFilter }[] = [
  { label: 'Vše', value: 'all' },
  { label: 'Ke kontrole', value: 'review' },
  { label: 'U poskytovatele', value: 'provider' },
  { label: 'Schválená', value: 'approved' },
  { label: 'Chyba', value: 'error' },
]

export function artworkFilterOf(value: string | null): ArtworkFilter {
  return ARTWORK_FILTERS.some((filter) => filter.value === value) ? (value as ArtworkFilter) : 'all'
}

/** What waits on the editors-in-chief: _Chyba_ and _Ke kontrole_ (`12a`, `11a`). */
export function isWaiting(state: ArtworkState): boolean {
  return state === 'error' || state === 'review'
}

/**
 * The table's order (`12a`): what waits on the editors first, _Chyba_ before _Ke kontrole_, then
 * by upload, newest first.
 */
export function compareArtworks(
  a: { state: ArtworkState; uploadedAt: Temporal.Instant },
  b: { state: ArtworkState; uploadedAt: Temporal.Instant },
): number {
  let rank = (state: ArtworkState) => (state === 'error' ? 0 : state === 'review' ? 1 : 2)
  return rank(a.state) - rank(b.state) || Temporal.Instant.compare(b.uploadedAt, a.uploadedAt)
}

export type ArtworkCounts = Readonly<Record<ArtworkState, number>>

export const NO_ARTWORKS: ArtworkCounts = { approved: 0, error: 0, provider: 0, review: 0 }

export function totalOf(counts: ArtworkCounts): number {
  return counts.approved + counts.error + counts.provider + counts.review
}

/** `1 schválené`, `2 schválená`, `5 schválených`. */
function approvedWord(count: number): string {
  if (count === 1) return 'schválené'
  return count >= 2 && count <= 4 ? 'schválená' : 'schválených'
}

/**
 * The line under the count in the article row's _Obrazová díla_ (`12a`): only what waits on the
 * editors, when anything does; the progress otherwise. `null` is an article without artworks,
 * whose cell is `—`.
 */
export function articleArtworksLine(
  counts: ArtworkCounts,
): { isWaiting: boolean; text: string } | null {
  if (totalOf(counts) === 0) return null
  if (counts.error > 0 || counts.review > 0) {
    let parts = [
      counts.error > 0 ? `${counts.error} s chybou` : null,
      counts.review > 0 ? `${counts.review} ke kontrole` : null,
    ].filter((part) => part !== null)
    return { isWaiting: true, text: parts.join(' · ') }
  }
  if (counts.provider === 0) {
    return { isWaiting: false, text: counts.approved === 1 ? 'schválené' : 'všechna schválená' }
  }
  if (counts.approved === 0) return { isWaiting: false, text: 'u poskytovatele' }
  return { isWaiting: false, text: `${counts.approved} ${approvedWord(counts.approved)}` }
}

/** `1 dílo`, `2 díla`, `5 děl`. */
export function artworksCount(count: number): string {
  if (count === 1) return '1 dílo'
  return count >= 2 && count <= 4 ? `${count} díla` : `${count} děl`
}

/**
 * `unsplash.com/photos/…`: a source as a short line shows it, the site and the first part of the
 * path, so a long address does not crowd the author (`21c`, `12a`).
 */
export function shownSource(source: string): string {
  let url: URL
  try {
    url = new URL(source)
  } catch {
    return source
  }
  let segments = url.pathname.split('/').filter((segment) => segment !== '')
  let first = segments[0] === undefined ? '' : `/${segments[0]}`
  let isCut = segments.length > 1 || url.search !== ''
  return `${url.host}${first}${isCut ? '/…' : ''}`
}

/** `Tereza Vlková · neuveden`, `neuveden · unsplash.com/photos/…` (`12a`). */
export function authorAndSource(author: string | null, source: string | null): string {
  return `${author || 'neuveden'} · ${source ? shownSource(source) : 'neuveden'}`
}

/** `autor neuveden · unsplash.com/photos/…`, `Ondřej Beneš · zdroj neuveden` (`21c`). */
export function sentArtworkLine(author: string | null, source: string | null): string {
  return `${author || 'autor neuveden'} · ${source ? shownSource(source) : 'zdroj neuveden'}`
}

export function driveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`
}

/* `21c`. */
export const SENT_TITLE = 'Díky, díla máme'

/**
 * `2 díla k článku „…“ jsou nahraná.` The drawing has two; one and five or more follow Czech
 * agreement, not yet through the copywriter.
 */
export function sentLead(count: number, articleName: string): string {
  if (count === 1) return `1 dílo k článku „${articleName}“ je nahrané.`
  if (count >= 2 && count <= 4) return `${count} díla k článku „${articleName}“ jsou nahraná.`
  return `${count} děl k článku „${articleName}“ je nahraných.`
}

export const CONSENT_CALLOUT_TITLE = 'Ještě souhlas e-mailem'

export function consentCalloutText(email: string): string {
  return `Na ${email} jsme poslali žádost o souhlas. K potvrzení souhlasu stačí odpověď jediným slovem „Souhlasím“. Bez souhlasu se díla do tisku nedostanou.`
}

export const CONSENT_CALLOUT_NOTE =
  'Žádost může být i ve spamu. Odesílatelem je publikace@vednemesicnik.cz.'
export const ANOTHER_BATCH_LABEL = 'Nahrát další díla'

/* `21d`: the submit's failures, a step as the Callout's title and the result under it. */
export type { ArtworksMessage } from './public/artwork-form.ts'

export const LINK_GONE_ON_SEND = {
  text: 'Tento odkaz mezitím přestal platit. Díla se neodeslala. Vyplněné údaje si můžete zkopírovat.',
  title: 'Pokud díla ještě potřebujete poslat, napište šéfredakci.',
}
export const UNAVAILABLE_ON_SEND = {
  text: 'Dokud je stránka otevřená, nahrané soubory tu zůstanou.',
  title: 'Zkuste díla odeslat za chvíli znovu.',
}
export const FOLDER_GONE_ON_SEND = {
  text: 'Díla se neodeslala. Teď nejde nahrát ani další soubor.',
  title: 'Zkuste díla odeslat později.',
}
export const SUBMIT_LIMIT_ON_SEND = {
  text: 'Z tohoto odkazu už za poslední hodinu proběhlo 30 odeslání. Nechte stránku otevřenou, abyste mohli odeslání zkusit znovu. Pokud díla potřebujete poslat hned, napište šéfredakci.',
  title: 'Zkuste díla odeslat později.',
}
export const RECIPIENT_LIMIT_ON_SEND = {
  text: 'Z tohoto odkazu už za posledních 24 hodin odešly žádosti na 5 různých adres. Další žádost teď může odejít jen na některou z nich.',
  title: 'Zkuste díla odeslat později.',
}
export const DAILY_CAP_TEXT =
  'Dnes už z formulářů Publikace odešlo příliš mnoho e-mailů. Údaje zůstávají ve formuláři.'
export const DAILY_CAP_ON_SEND = { text: DAILY_CAP_TEXT, title: 'Zkuste díla odeslat později.' }
export const DISCARDED_ON_SEND = {
  text: 'Šéfredakce původní díla mezitím zahodila. Z tohoto formuláře už je nelze odeslat. Jméno a e-mail zůstaly vyplněné.',
  title: 'Nahrajte díla znovu.',
}

/** On _Díky, díla máme_ when the Mailer refused the request for good (`21d`). */
export function refusedOnSent(email: string): { text: string; title: string } {
  return {
    text: `Pošta odmítla žádost o souhlas na ${email}. Díla máme uložená a tady už nic odesílat nemusíte.`,
    title: 'Další postup je na šéfredakci.',
  }
}

/* `02f`: one page for a replaced link, a closed issue and a key nobody issued. */
export const ARTWORKS_LINK_GONE_TITLE = 'Z tohoto odkazu nejde nahrát obrazová díla'
export const ARTWORKS_LINK_GONE_TEXT = 'Pokud díla ještě potřebujete poslat, napište šéfredakci.'
export const ARTWORKS_LINK_GONE_NOTE = 'Neplatný odkaz nemá vliv na díla, která jste už odeslali.'

/* `12a`, `12o`. */
export const ARTWORKS_SECTION_TITLE = 'Obrazová díla'
export const ARTWORK_COLUMN = 'Dílo'
export const PROVIDER_COLUMN = 'Poskytovatel'
export const AUTHOR_SOURCE_COLUMN = 'Autor · zdroj'
export const STATE_COLUMN = 'Stav'
export const OPEN_ARTWORK_LABEL = 'Otevřít dílo na Disku'
export const COPY_ARTWORKS_LINK_LABEL = 'Kopírovat odkaz na nahrání děl'

export function artworkMenuLabel(fileName: string): string {
  return `Další akce díla ${fileName}`
}

export function resendLabel(count: number): string {
  return `Poslat žádost znovu · ${artworksCount(count)}`
}

export function discardLabel(count: number): string {
  return `Zahodit dávku · ${artworksCount(count)}…`
}

export function discardDialogTitle(count: number): string {
  return `Zahodit dávku ${count} ${count === 1 ? 'díla' : 'děl'}?`
}

export function discardDialogText(articleName: string, email: string): string {
  return `Díla k článku „${articleName}“ i jejich PDF se přesunou do koše sdíleného disku Publikace. Díla z vydání zmizí a další žádost o souhlas k nim už nepůjde poslat. Poskytovateli (${email}) žádné upozornění neodejde. Dokud odkaz platí, lze jím díla nahrát znovu.`
}

export const DISCARD_CONFIRM_LABEL = 'Zahodit dávku'
export const DISCARD_CANCEL_LABEL = 'Zrušit'

/* `12o`: the dialog's Callout when the discard did not go through, the step over the state. */
export const DISCARD_UNAVAILABLE_TITLE = 'Zkuste dávku zahodit za chvíli znovu.'
export const DISCARD_DISCONNECTED_TITLE =
  'Nejdřív v Nastavení připojte účet publikace.app@vednemesicnik.cz. Pak zkuste dávku zahodit znovu.'
/** Drive refused to take back what the attempt had put in the bin; not in the drawing. */
export const DISCARD_PARTLY_BINNED_TEXT = 'Část souborů už může být v koši.'

/* The toasts after _Poslat žádost znovu_ and _Zahodit dávku_. */
export function resentToast(email: string): string {
  return `Žádost o souhlas odešla na ${email}.`
}
export const RESEND_UNAVAILABLE_TOAST =
  'Zkuste žádost poslat za chvíli znovu. Odeslání se nepodařilo potvrdit.'
export const RESEND_DISCONNECTED_TOAST =
  'Nejdřív v Nastavení připojte účet publikace.app@vednemesicnik.cz. Pak zkuste žádost poslat znovu.'
export const RESEND_PDF_GONE_TOAST =
  'Vraťte PDF dávky z koše sdíleného disku. Pokud je neobnovíte, můžete dávku zahodit.'
export const RESEND_REFUSED_TOAST =
  'Zahoďte dávku. Pošta žádost trvale odmítla. O nové nahrání děl požádejte poskytovatele.'
export const RESEND_DAILY_CAP_TOAST =
  'Zkuste žádost poslat později. Dnes už z formulářů Publikace odešlo příliš mnoho e-mailů.'

/** `2 díla i jejich PDF jsou v koši…`; one and five or more by agreement, not yet through copy. */
export function discardedToast(count: number): string {
  if (count === 1) return '1 dílo i jeho PDF je v koši sdíleného disku Publikace.'
  if (count >= 2 && count <= 4) {
    return `${count} díla i jejich PDF jsou v koši sdíleného disku Publikace.`
  }
  return `${count} děl i jejich PDF je v koši sdíleného disku Publikace.`
}
