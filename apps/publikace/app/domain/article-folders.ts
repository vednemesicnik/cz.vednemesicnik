/**
 * An article's three folders on Drive, and the words `12j` and `12o` give one that is missing, as
 * the copywriter settled them (`ktwvsuvc`): the article's own folder, and `Obrazová díla` and
 * `Licence` inside it (`2kig3d8m`). An artwork group has the same three, and `12j` words them
 * the same but for the group's own folder and its link.
 */

import type { HolderKind } from './artwork.ts'
import { atTime, formatDayMonth } from './time.ts'
import { tied } from './public/typography.ts'

export type ArticleFolderKind = 'article' | 'artworks' | 'licences'

/** The two folders inside an article's folder, named as everybody sees them on Drive. */
export const ARTWORKS_FOLDER_NAME = 'Obrazová díla'
export const LICENCES_FOLDER_NAME = 'Licence'

export type SubfolderKind = Exclude<ArticleFolderKind, 'article'>

/** A heading as text and the subfolders' names, which the screen turns into links to Drive. */
export type HeadingPart = string | { folder: SubfolderKind; name: string }

const ORDER: readonly ArticleFolderKind[] = ['article', 'artworks', 'licences']

function inOrder(missing: readonly ArticleFolderKind[]): ArticleFolderKind[] {
  return ORDER.filter((kind) => missing.includes(kind))
}

function subfolder(kind: SubfolderKind): HeadingPart {
  return { folder: kind, name: kind === 'artworks' ? ARTWORKS_FOLDER_NAME : LICENCES_FOLDER_NAME }
}

/**
 * The step that names every missing folder of one article or group (`12j`). The holder's own
 * folder has no link: its name is the row's, right above. Every article and group has an
 * `Obrazová díla` and a `Licence`, and the bin may hold many of each, so those names link to the
 * very folder.
 *
 * The holder's folder with both folders inside it, each in the bin on its own, is not drawn; it
 * gets the holder folder's step, which is not false, and the check after it names the rest.
 */
export function missingFoldersHeading(
  missing: readonly ArticleFolderKind[],
  holder: HolderKind,
): HeadingPart[] {
  let kinds = inOrder(missing)
  let subfolders = kinds.filter((kind): kind is SubfolderKind => kind !== 'article')
  let isOwnMissing = kinds.includes('article')
  let own = holder === 'group' ? 'složku skupiny' : 'složku článku'
  let [only] = subfolders
  if (isOwnMissing && subfolders.length === 1 && only !== undefined) {
    return [
      tied`Obnovte ${own} a složku `,
      subfolder(only),
      tied` z koše, nebo je vraťte na sdílený disk Publikace.`,
    ]
  }
  if (isOwnMissing) return [tied`Obnovte ${own} z koše, nebo ji vraťte na sdílený disk Publikace.`]
  if (subfolders.length === 2) {
    return [
      'Obnovte složky ',
      subfolder('artworks'),
      tied` a `,
      subfolder('licences'),
      tied` z koše, nebo je vraťte na sdílený disk Publikace.`,
    ]
  }
  return [
    'Obnovte složku ',
    subfolder(only ?? 'licences'),
    tied` z koše, nebo ji vraťte na sdílený disk Publikace.`,
  ]
}

/** The heading as plain text, for a check that it reads as drawn. */
export function headingText(parts: readonly HeadingPart[]): string {
  return parts.map((part) => (typeof part === 'string' ? part : part.name)).join('')
}

/**
 * The sentences under the step: what the article or the group cannot do and when the app found it
 * (`12j`). Only the first names the holder's link; the rest are the same for both.
 * Each sentence stands only where it holds. The request is named only where a batch waits for
 * _Poslat žádost znovu_, which needs the holder's own folder and `Licence`. The consents are named
 * only where `Licence` is missing and a batch still waits for its consent: the reply check records
 * the consent meanwhile, and archives the conversation on its first run once the folder is back,
 * when the claim hands it the folder again. Where the step names another folder beside
 * `Licence`, the sentence names `Licence`, so that it says into which.
 */
export function missingFoldersLines(view: {
  foundAt: Temporal.Instant
  hasBatchAwaitingConsent: boolean
  hasBatchToResend: boolean
  holder: HolderKind
  missing: readonly ArticleFolderKind[]
}): string[] {
  let lines = [view.holder === 'group' ? GROUP_LINK_STOPPED_TEXT : LINK_STOPPED_TEXT]
  let isLicenceMissing = view.missing.includes('licences')
  let isResendStopped = view.missing.includes('article') || isLicenceMissing
  if (view.hasBatchToResend && isResendStopped) lines.push(RESEND_STOPPED_TEXT)
  if (view.hasBatchAwaitingConsent && isLicenceMissing) {
    lines.push(CONSENTS_RECORDED_TEXT)
    lines.push(view.missing.length === 1 ? ARCHIVE_LATER_TEXT : ARCHIVE_LATER_IN_LICENCE_TEXT)
  }
  lines.push(`Zjištěno ${formatDayMonth(view.foundAt)} ${atTime(view.foundAt)}.`)
  return lines
}

export const LINK_STOPPED_TEXT = tied`Z odkazu na nahrání děl teď nejde díla nahrát ani odeslat.`
export const GROUP_LINK_STOPPED_TEXT = tied`Z odkazu skupiny teď nejde díla nahrát ani odeslat.`
export const RESEND_STOPPED_TEXT = tied`Žádost o souhlas nejde poslat znovu.`
export const CONSENTS_RECORDED_TEXT = 'Souhlasy se dál zaznamenávají.'
export const ARCHIVE_LATER_TEXT = tied`Konverzace se do složky uloží při první kontrole odpovědí po jejím návratu.`
export const ARCHIVE_LATER_IN_LICENCE_TEXT = tied`Konverzace se do složky Licence uloží při první kontrole odpovědí po jejím návratu.`
export const CHECK_AGAIN_LABEL = 'Zkontrolovat znovu'
/** What _Zkontrolovat znovu_ says while Drive is asked (`12j`). */
export const CHECKING_LABEL = 'Kontroluje se…'

/* The toasts after _Zkontrolovat znovu_ (`12j`). One folder of two back gets the singular error,
   which says what still has to be done. */
export const FOLDER_BACK_TOAST = 'Složka je zpátky na sdíleném disku Publikace.'
export const FOLDERS_BACK_TOAST = 'Obě složky jsou zpátky na sdíleném disku Publikace.'
export const FOLDER_STILL_MISSING_TOAST = tied`Obnovte složku z koše, nebo ji vraťte na sdílený disk Publikace. Stále není dostupná.`
export const FOLDERS_STILL_MISSING_TOAST = tied`Obnovte složky z koše, nebo je vraťte na sdílený disk Publikace. Stále nejsou dostupné.`
export const CHECK_UNAVAILABLE_TOAST = 'Zkuste kontrolu za chvíli znovu.'

/**
 * What _Zkontrolovat znovu_ says, from the folders checked and the ones still missing: an
 * article's or a group's, or the issue's own (#134).
 */
export function checkedToast(
  checked: readonly string[],
  stillMissing: readonly string[],
): { text: string; tone: 'error' | 'success' } {
  if (stillMissing.length === 0) {
    return { text: checked.length > 1 ? FOLDERS_BACK_TOAST : FOLDER_BACK_TOAST, tone: 'success' }
  }
  return {
    text: stillMissing.length > 1 ? FOLDERS_STILL_MISSING_TOAST : FOLDER_STILL_MISSING_TOAST,
    tone: 'error',
  }
}

/** `12o`: _Poslat žádost znovu_ met a missing article folder or `Licence`. */
export const RESEND_FOLDER_GONE_TOAST = tied`Obnovte složku z koše, nebo ji vraťte na sdílený disk Publikace. Žádost se neodeslala.`

/** `12o`: the reason under the step in the dialog _Zahodit dávku_, as when Drive did not answer. */
export const DISCARD_KEPT_TEXT = 'Dávka zůstala, jak byla.'

/** Whether _Poslat žádost znovu_ can reach the batch's PDFs, and _Zahodit dávku_ every file. */
export function canResend(missing: readonly ArticleFolderKind[]): boolean {
  return !missing.includes('article') && !missing.includes('licences')
}

export function canDiscard(missing: readonly ArticleFolderKind[]): boolean {
  return missing.length === 0
}
