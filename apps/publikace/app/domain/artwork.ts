/**
 * Artworks (_obrazová díla_) and their batches: the limits of the link, the subject the reply
 * check pairs by, the state `01b` gives a batch, and the words `21c`, `21d`, `02f` and `12a`
 * give them, as the copywriter settled them (`zoy6ixjt`). The form's rules are in
 * `public/artwork-form.ts`, which the browser loads too.
 */

import type { ApprovedCount } from './issue.ts'
import { formatDayMonth } from './time.ts'
import { tied } from './public/typography.ts'

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

/**
 * What a batch, an upload and an artworks link belong to: an article or an artwork group (#133).
 * A group has no Doc and no authors, and its link is the one the editors-in-chief hand out.
 */
export type HolderKind = 'article' | 'group'

/** A batch's holder as far as its words go: which kind, and its name. */
export type HolderName = { kind: HolderKind; name: string }

/**
 * The request's subject. Only the words between the prefix and the name depend on the holder;
 * a group's is the copywriter's (`kef75qeh`): _ze skupiny_, because the provider who reads it may
 * never have seen the upload page that says _Ke skupině_.
 */
export function consentSubject(holder: HolderName, issueName: string, tag: string): string {
  let target = holder.kind === 'group' ? 'ze skupiny' : 'ke článku'
  return `${CONSENT_SUBJECT_PREFIX} ${target} „${holder.name}“ – ${issueName} [${tag}]`
}

/** The Mailer's idempotency key of a batch's request: a resend from anywhere is the same e-mail. */
export function consentIdempotencyKey(formKey: string): string {
  return `artwork-consent:${formKey}`
}

/** The states of `01b` an artwork of the app can be in. */
export type ArtworkState = 'approved' | 'error' | 'provider' | 'review'

/** A committed batch, as far as its state goes: its request, the reply and what came of it. */
export type BatchStatus = {
  /**
   * When an answer from _Ke kontrole_ to the latest reply went (`13e`); `null` while that reply
   * has none, so a newer reply from the provider brings the batch back to _Ke kontrole_.
   */
  answeredAt: Temporal.Instant | null
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
export function mayArchive(
  batch: Pick<BatchStatus, 'consentVerifiedAt' | 'discardedAt' | 'isExactConsent'>,
): boolean {
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
 *   „Souhlasím“ the job is about to archive, after an answer from _Ke kontrole_ to the latest
 *   reply (`13e`), and while the request waits for an answer.
 * - _Ke kontrole_ for any other reply.
 */
export function batchState(batch: BatchStatus): ArtworkState {
  if (batch.approvedAt !== null) return 'approved'
  if (batch.archiveFailedAt !== null) return 'error'
  if (batch.replyMessageId !== null) {
    return mayArchive(batch) || batch.answeredAt !== null ? 'provider' : 'review'
  }
  return batch.mailSentAt === null ? 'error' : 'provider'
}

/** _Chyba_ because the request never went, where _Poslat žádost znovu_ and _Zahodit_ belong. */
export function isMailError(batch: BatchStatus): boolean {
  return batchState(batch) === 'error' && batch.archiveFailedAt === null
}

/**
 * A batch whose consent may still come and has yet to be archived in `Licence`: not approved, and
 * its request went. `12j` calls it „dávka, která čeká na odpověď“; a reply in _Ke kontrole_ and a
 * failed archive count too, since the reply check archives both once it can.
 */
export function isAwaitingConsent(batch: BatchStatus): boolean {
  return batch.approvedAt === null && !isMailError(batch)
}

/** The first line of a reply, cut to fit under a tag: _odpověď „ok, souhlas“_ (`01b`). */
export function replyExcerpt(text: string): string {
  let line = text.trim().split('\n')[0]?.trim() ?? ''
  return line.length > 40 ? `${line.slice(0, 39).trimEnd()}…` : line
}

export const ARTWORK_STATE_LABELS: Readonly<Record<ArtworkState, string>> = {
  approved: 'Schváleno',
  error: 'Chyba',
  provider: tied`U poskytovatele`,
  review: 'Ke kontrole',
}

/**
 * The Mailer did not confirm that a request for consent went out. The line claims no delivery and
 * no bounce, which no job reads (copy `4k262ttk`), and stands under _Chyba_ for a batch, an
 * article and an author's clause alike (`01a`, `12b`, `12o`).
 */
export const UNCONFIRMED_SEND_LINE = tied`chybí potvrzení o odeslání žádosti`

/** Under _Schváleno_: the conversation is the proof, archived in `Licence` (`01b`, `13e`). */
export const IN_LICENCE_LINE = tied`konverzace v Licencích`

/** The line under the tag (`12a`, `01b`, `13c`). */
export function batchStateDetail(batch: BatchStatus): string {
  if (batch.approvedAt !== null) return IN_LICENCE_LINE
  if (batch.archiveFailedAt !== null) return 'konverzace se neuložila'
  if (batch.consentVerifiedAt !== null) {
    return `souhlas zaznamenán ${formatDayMonth(batch.consentVerifiedAt)}`
  }
  /* The date of the last e-mail that went to the provider, as `žádost odeslána` has it (`01b`). */
  if (batch.answeredAt !== null && batchState(batch) === 'provider') {
    return `odpověď odeslána ${formatDayMonth(batch.answeredAt)}`
  }
  if (batch.replyMessageId !== null && batchState(batch) === 'review') {
    if (batch.discardedAt !== null) return `dávka zahozena ${formatDayMonth(batch.discardedAt)}`
    return `odpověď „${replyExcerpt(batch.replyText ?? '')}“`
  }
  if (batch.mailSentAt !== null) return `žádost odeslána ${formatDayMonth(batch.mailSentAt)}`
  if (batch.mailRefusedAt !== null) return 'pošta žádost trvale odmítla'
  return UNCONFIRMED_SEND_LINE
}

/* `12a`, the filter over the table, in the address as `?artworks=`. */
export type ArtworkFilter = 'all' | ArtworkState

export const ARTWORK_FILTERS: readonly { label: string; value: ArtworkFilter }[] = [
  { label: 'Vše', value: 'all' },
  { label: 'Ke kontrole', value: 'review' },
  { label: tied`U poskytovatele`, value: 'provider' },
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
 * The line under the count of artworks in the overview (`11a`), a batch counting when it is
 * _Schváleno_ (`01b`). `null` is an issue without artworks. None approved says `0 schválených`
 * rather than the detail's `u poskytovatele`, which the overview cannot tell from a zero.
 */
export function approvedArtworksLine(count: ApprovedCount): string | null {
  if (count.total === 0) return null
  if (count.approved === count.total) return count.total === 1 ? 'schválené' : 'všechna schválená'
  return `${count.approved} ${approvedWord(count.approved)}`
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
      counts.error > 0 ? tied`${counts.error} s chybou` : null,
      counts.review > 0 ? `${counts.review} ke kontrole` : null,
    ].filter((part) => part !== null)
    return { isWaiting: true, text: parts.join(' · ') }
  }
  if (counts.provider === 0) {
    return { isWaiting: false, text: counts.approved === 1 ? 'schválené' : 'všechna schválená' }
  }
  if (counts.approved === 0) return { isWaiting: false, text: tied`u poskytovatele` }
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
 * agreement, not yet through the copywriter. A group's three forms are the copywriter's
 * (`kef75qeh`): _nově_, because the group may hold artworks from an earlier batch.
 */
export function sentLead(count: number, holder: HolderName): string {
  let { name } = holder
  if (holder.kind === 'group') {
    if (count === 1) return tied`Ve skupině „${name}“ je nově nahrané 1 dílo.`
    if (count >= 2 && count <= 4) return tied`Ve skupině „${name}“ jsou nově nahraná ${count} díla.`
    return tied`Ve skupině „${name}“ je nově nahraných ${count} děl.`
  }
  if (count === 1) return tied`1 dílo k článku „${name}“ je nahrané.`
  if (count >= 2 && count <= 4) return tied`${count} díla k článku „${name}“ jsou nahraná.`
  return tied`${count} děl k článku „${name}“ je nahraných.`
}

export const CONSENT_CALLOUT_TITLE = 'Ještě souhlas e-mailem'

export function consentCalloutText(email: string): string {
  return tied`Na ${email} jsme poslali žádost o souhlas. K potvrzení souhlasu stačí odpověď jediným slovem „Souhlasím“. Bez souhlasu se díla do tisku nedostanou.`
}

export const CONSENT_CALLOUT_NOTE = tied`Žádost může být i ve spamu. Odesílatelem je publikace@vednemesicnik.cz.`
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
  text: tied`Z tohoto odkazu už za poslední hodinu proběhlo 30 odeslání. Nechte stránku otevřenou, abyste mohli odeslání zkusit znovu. Pokud díla potřebujete poslat hned, napište šéfredakci.`,
  title: 'Zkuste díla odeslat později.',
}
export const RECIPIENT_LIMIT_ON_SEND = {
  text: tied`Z tohoto odkazu už za posledních 24 hodin odešly žádosti na 5 různých adres. Další žádost teď může odejít jen na některou z nich.`,
  title: 'Zkuste díla odeslat později.',
}
export const DAILY_CAP_TEXT = tied`Dnes už z formulářů Publikace odešlo příliš mnoho e-mailů. Údaje zůstávají ve formuláři.`
export const DAILY_CAP_ON_SEND = { text: DAILY_CAP_TEXT, title: 'Zkuste díla odeslat později.' }
export const DISCARDED_ON_SEND = {
  text: tied`Šéfredakce původní díla mezitím zahodila. Z tohoto formuláře už je nelze odeslat. Jméno a e-mail zůstaly vyplněné.`,
  title: 'Nahrajte díla znovu.',
}

/** On _Díky, díla máme_ when the Mailer refused the request for good (`21d`). */
export function refusedOnSent(email: string): { text: string; title: string } {
  return {
    text: tied`Pošta odmítla žádost o souhlas na ${email}. Díla máme uložená a tady už nic odesílat nemusíte.`,
    title: 'Další postup je na šéfredakci.',
  }
}

/* `02f`: one page for a replaced link, a closed issue and a key nobody issued. */
export const ARTWORKS_LINK_GONE_TITLE = tied`Z tohoto odkazu nejde nahrát obrazová díla`
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

/**
 * A group's text is the copywriter's (`kef75qeh`): _z této dávky_, so that it does not read as the
 * whole group going to the bin, and the group named as staying even when it is left empty. Its last
 * sentence is the article's, which stays true once a group's link can be renewed.
 */
export function discardDialogText(holder: HolderName, email: string): string {
  if (holder.kind === 'group') {
    return tied`Díla z této dávky i PDF jejich licencí se přesunou do koše sdíleného disku Publikace. Díla z vydání zmizí a další žádost o souhlas k nim už nepůjde poslat. Poskytovateli (${email}) žádné upozornění neodejde. Skupina „${holder.name}“ zůstane i prázdná. Dokud odkaz platí, lze jím díla nahrát znovu.`
  }
  return tied`Díla k článku „${holder.name}“ i jejich PDF se přesunou do koše sdíleného disku Publikace. Díla z vydání zmizí a další žádost o souhlas k nim už nepůjde poslat. Poskytovateli (${email}) žádné upozornění neodejde. Dokud odkaz platí, lze jím díla nahrát znovu.`
}

export const DISCARD_CONFIRM_LABEL = 'Zahodit dávku'
export const DISCARD_CANCEL_LABEL = 'Zrušit'

/* `12o`: the dialog's Callout when the discard did not go through, the step over the state. */
export const DISCARD_UNAVAILABLE_TITLE = 'Zkuste dávku zahodit za chvíli znovu.'
export const DISCARD_DISCONNECTED_TITLE = tied`Nejdřív v Nastavení připojte účet publikace.app@vednemesicnik.cz. Pak zkuste dávku zahodit znovu.`
/** Drive refused to take back what the attempt had put in the bin; not in the drawing. */
export const DISCARD_PARTLY_BINNED_TEXT = tied`Část souborů už může být v koši.`

/* The toasts after _Poslat žádost znovu_ and _Zahodit dávku_. */
export function resentToast(email: string): string {
  return tied`Žádost o souhlas odešla na ${email}.`
}
export const RESEND_UNAVAILABLE_TOAST =
  'Zkuste žádost poslat za chvíli znovu. Odeslání se nepodařilo potvrdit.'
export const RESEND_DISCONNECTED_TOAST = tied`Nejdřív v Nastavení připojte účet publikace.app@vednemesicnik.cz. Pak zkuste žádost poslat znovu.`
export const RESEND_PDF_GONE_TOAST = tied`Vraťte PDF dávky z koše sdíleného disku. Pokud je neobnovíte, můžete dávku zahodit.`
export const RESEND_REFUSED_TOAST = tied`Zahoďte dávku. Pošta žádost trvale odmítla. O nové nahrání děl požádejte poskytovatele.`
export const RESEND_DAILY_CAP_TOAST = tied`Zkuste žádost poslat později. Dnes už z formulářů Publikace odešlo příliš mnoho e-mailů.`

/** `2 díla i jejich PDF jsou v koši…`; one and five or more by agreement, not yet through copy. */
export function discardedToast(count: number): string {
  if (count === 1) return tied`1 dílo i jeho PDF je v koši sdíleného disku Publikace.`
  if (count >= 2 && count <= 4) {
    return tied`${count} díla i jejich PDF jsou v koši sdíleného disku Publikace.`
  }
  return tied`${count} děl i jejich PDF je v koši sdíleného disku Publikace.`
}
