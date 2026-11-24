/**
 * The links for the newsroom (`02`): what a key looks like, when a link answers, and the words
 * `02b`–`02e`, `12a` and `12c` give it.
 *
 * Pure, so the rules and the sentences are tested here rather than through a request.
 */

import { formatDate, formatDayMonth, pragueYear } from './time.ts'
import { tied } from './public/typography.ts'

/** Twelve characters of this alphabet, random, naming no folder and no issue (`02a`). */
export const LINK_KEY_LENGTH = 12
export const LINK_KEY_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

const KEY_SHAPE = /^[A-Za-z0-9]{12}$/

/** A key that could exist, before the database is asked: a cut-off address is not one. */
export function isLinkKey(value: string): boolean {
  return KEY_SHAPE.test(value)
}

export type LinkKind = 'article' | 'artworks'

export type Link = {
  /** The article an artworks link uploads to; `null` for an issue's link and a group's. */
  articleId: number | null
  createdAt: Temporal.Instant
  /** The artwork group an artworks link uploads to, in place of an article (#133). */
  groupId: number | null
  id: number
  issueId: number
  key: string
  kind: LinkKind
  revokedAt: Temporal.Instant | null
}

/** How many articles came through a link, and when the last one did. */
export type LinkUsage = { count: number; lastAt: Temporal.Instant | null }

/**
 * Whether a link answers. `gone` is a replaced link or one of a closed issue (410); `unknown` a
 * key nobody issued (404). Both draw the same page, so nobody learns that a key exists (`02e`).
 */
export type LinkState = 'gone' | 'unknown' | 'valid'

export function linkState(
  link: Pick<Link, 'revokedAt'> | null,
  issue: { closedAt: Temporal.Instant | null; completedAt: Temporal.Instant | null } | null,
): LinkState {
  if (link === null || issue === null || issue.completedAt === null) return 'unknown'
  if (link.revokedAt !== null || issue.closedAt !== null) return 'gone'
  return 'valid'
}

export function articleLinkPath(key: string): string {
  return `/l/${key}/article`
}

export function artworksLinkPath(key: string): string {
  return `/l/${key}/artworks`
}

/** `https://publikace.vednemesicnik.cz/l/k7Qm2xR4pT9a/article`, for copying and sharing. */
export function absoluteUrl(origin: string, path: string): string {
  return new URL(path, origin).href
}

/** `publikace.vednemesicnik.cz/l/k7Qm2xR4pT9a/article`: the URL as the block shows it (`12a`). */
export function shownUrl(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

/* `12a`, `12c`, as the copywriter settled them (il3qqrj9). */
export const LINK_SECTION_TITLE = 'Odkaz pro redakci'
export const LINK_SECTION_TEXT = tied`Pošlete odkaz do skupiny redakce. Kdokoli s odkazem může založit článek v tomto vydání.`
export const ARTICLE_LINK_LABEL = 'Nový článek'
export const OPEN_FORM_LABEL = 'Otevřít formulář'
export const RENEW_LINK_LABEL = 'Vydat nový odkaz…'
export const SHARE_LABEL = 'Sdílet'

/**
 * `Použit 5×, naposledy 10. 11.` or `Zatím nepoužit`. The year is left out within the current
 * year, as `docs/copy-context.md` allows. A renewed link starts from nothing (`02d`).
 */
export function usageLine(usage: LinkUsage, today: Temporal.Instant): string {
  if (usage.count === 0 || usage.lastAt === null) return 'Zatím nepoužit'
  let when =
    pragueYear(usage.lastAt) === pragueYear(today)
      ? formatDayMonth(usage.lastAt)
      : formatDate(usage.lastAt)
  return `Použit ${usage.count}×, naposledy ${when}`
}

/** The text _Sdílet_ prefills (`02b`): it stands alone where a messenger shows no preview. */
export function shareText(issueName: string, url: string): string {
  return `Nový článek do vydání ${issueName} založíte tady: ${url}`
}

/* `02c`: the card a messenger draws under the message. An invalid key gets the generic title and
   no description. */
export function previewTitle(issueName: string): string {
  return `Nový článek do vydání ${issueName}`
}
export const PREVIEW_DESCRIPTION = 'Vedneměsíčník · Publikace'
export const PREVIEW_GENERIC_TITLE = 'Vedneměsíčník · Publikace'

/* `02d`. */
export const RENEW_DIALOG_TITLE = 'Vydat nový odkaz pro redakci?'
export const RENEW_DIALOG_TEXT = tied`Dosavadní odkaz hned přestane platit i lidem, kteří ho už mají v konverzaci.`
export const RENEW_DIALOG_NOTE = tied`Rozepsané články zůstanou v dokumentech Google.`
export const RENEW_CONFIRM_LABEL = 'Vydat nový odkaz'
export const RENEWED_TOAST = 'Pošlete redakci nový odkaz. Starý už neplatí.'

/* `02e`: one page for a replaced link, a closed issue and a key nobody issued. */
export const LINK_GONE_TITLE = tied`Z tohoto odkazu nejde založit článek`
export const LINK_GONE_TEXT = tied`Napište šéfredakci a požádejte o aktuální odkaz.`
export const LINK_GONE_NOTE = tied`Pokud už máte článek rozepsaný, můžete v něm dál psát v dokumentu Google.`
