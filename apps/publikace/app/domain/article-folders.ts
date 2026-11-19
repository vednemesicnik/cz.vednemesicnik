/**
 * An article's three folders on Drive, and the words `12j` and `12o` give one that is missing, as
 * the copywriter settled them (`ktwvsuvc`): the article's own folder, and `Obrazová díla` and
 * `Licence` inside it (`2kig3d8m`).
 */

import { atTime, formatDayMonth } from './time.ts'

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
 * The step that names every missing folder of one article (`12j`). The article's folder has no
 * link: its name is the article's, right above. Every article has an `Obrazová díla` and a
 * `Licence`, and the bin may hold many of each, so those names link to the very folder.
 *
 * The article's folder with both folders inside it, each in the bin on its own, is not drawn; it
 * gets the article folder's step, which is not false, and the check after it names the rest.
 */
export function missingFoldersHeading(missing: readonly ArticleFolderKind[]): HeadingPart[] {
  let kinds = inOrder(missing)
  let subfolders = kinds.filter((kind): kind is SubfolderKind => kind !== 'article')
  let isArticle = kinds.includes('article')
  let [only] = subfolders
  if (isArticle && subfolders.length === 1 && only !== undefined) {
    return [
      'Obnovte složku článku a složku ',
      subfolder(only),
      ' z koše, nebo je vraťte na sdílený disk Publikace.',
    ]
  }
  if (isArticle) return ['Obnovte složku článku z koše, nebo ji vraťte na sdílený disk Publikace.']
  if (subfolders.length === 2) {
    return [
      'Obnovte složky ',
      subfolder('artworks'),
      ' a ',
      subfolder('licences'),
      ' z koše, nebo je vraťte na sdílený disk Publikace.',
    ]
  }
  return [
    'Obnovte složku ',
    subfolder(only ?? 'licences'),
    ' z koše, nebo ji vraťte na sdílený disk Publikace.',
  ]
}

/** The heading as plain text, for a check that it reads as drawn. */
export function headingText(parts: readonly HeadingPart[]): string {
  return parts.map((part) => (typeof part === 'string' ? part : part.name)).join('')
}

/**
 * The sentences under the step: what the article cannot do and when the app found it (`12j`).
 * The request is named only where a batch waits for _Poslat žádost znovu_, which needs the
 * article's folder and `Licence`. The sentence about consents waits for the reply check to go
 * through the app; until then it would promise what nothing does.
 */
export function missingFoldersLines(view: {
  foundAt: Temporal.Instant
  hasBatchToResend: boolean
  missing: readonly ArticleFolderKind[]
}): string[] {
  let lines = [LINK_STOPPED_TEXT]
  let isResendStopped = view.missing.includes('article') || view.missing.includes('licences')
  if (view.hasBatchToResend && isResendStopped) lines.push(RESEND_STOPPED_TEXT)
  lines.push(`Zjištěno ${formatDayMonth(view.foundAt)} ${atTime(view.foundAt)}.`)
  return lines
}

export const LINK_STOPPED_TEXT = 'Z odkazu na nahrání děl teď nejde díla nahrát ani odeslat.'
export const RESEND_STOPPED_TEXT = 'Žádost o souhlas nejde poslat znovu.'
export const CHECK_AGAIN_LABEL = 'Zkontrolovat znovu'

/* The toasts after _Zkontrolovat znovu_ (`12j`). One folder of two back gets the singular error,
   which says what still has to be done. */
export const FOLDER_BACK_TOAST = 'Složka je zpátky na sdíleném disku Publikace.'
export const FOLDERS_BACK_TOAST = 'Obě složky jsou zpátky na sdíleném disku Publikace.'
export const FOLDER_STILL_MISSING_TOAST =
  'Obnovte složku z koše, nebo ji vraťte na sdílený disk Publikace. Stále není dostupná.'
export const FOLDERS_STILL_MISSING_TOAST =
  'Obnovte složky z koše, nebo je vraťte na sdílený disk Publikace. Stále nejsou dostupné.'
export const CHECK_UNAVAILABLE_TOAST = 'Zkuste kontrolu za chvíli znovu.'

/** What _Zkontrolovat znovu_ says, from the folders checked and the ones still missing. */
export function checkedToast(
  checked: readonly ArticleFolderKind[],
  stillMissing: readonly ArticleFolderKind[],
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
export const RESEND_FOLDER_GONE_TOAST =
  'Obnovte složku z koše, nebo ji vraťte na sdílený disk Publikace. Žádost se neodeslala.'

/** `12o`: the reason under the step in the dialog _Zahodit dávku_, as when Drive did not answer. */
export const DISCARD_KEPT_TEXT = 'Dávka zůstala, jak byla.'

/** Whether _Poslat žádost znovu_ can reach the batch's PDFs, and _Zahodit dávku_ every file. */
export function canResend(missing: readonly ArticleFolderKind[]): boolean {
  return !missing.includes('article') && !missing.includes('licences')
}

export function canDiscard(missing: readonly ArticleFolderKind[]): boolean {
  return missing.length === 0
}
