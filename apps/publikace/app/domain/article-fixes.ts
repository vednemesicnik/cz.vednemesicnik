/**
 * Mending what was typed wrong when an article was created (#152): _Přejmenovat článek…_ (`12x`)
 * and _Upravit autory…_ (`12y`), where each stands (`12u`) and every word of both dialogs. The
 * wording is the copywriter's (`ggqtf0xy`), drawn in `786r4cpa`.
 *
 * Pure, so the rules and the sentences are tested here rather than through Drive.
 */

import { type ClauseState, AGREED_CLAUSE_LABEL } from './approvals.ts'
import type { FinalVersion } from './article.ts'
import type { CalloutPart, FixCallout } from './issue-fixes.ts'
import { type ArticleStep, whoOf } from './article.ts'
import { formatMoment } from './time.ts'
import { tied } from './public/typography.ts'

export const RENAME_ARTICLE_LABEL = 'Přejmenovat článek…'
export const EDIT_AUTHORS_LABEL = 'Upravit autory…'

/**
 * A clause whose author agreed: the reply was a consent, exact or decided, archived or not yet
 * (`clauseState`). Such an author is read only in `12y`, since what a consent covers is never
 * changed.
 */
export function isAgreed(state: ClauseState): boolean {
  return state === 'approved' || state === 'verified' || state === 'unarchived'
}

type FixedArticle = { finalVersion: Pick<FinalVersion, 'authors'> | null }

/**
 * Until the final version is marked, in an issue still open (`12u`). A marked one is out even
 * before its clauses went, because each clause names the article.
 */
export function canRenameArticle(article: FixedArticle, isIssueOpen: boolean): boolean {
  return isIssueOpen && article.finalVersion === null
}

/**
 * Before the final version always; after it while at least one author has not agreed (`12u`).
 * In an issue still open, as every fix but the issue's removal.
 */
export function canEditAuthors(article: FixedArticle, isIssueOpen: boolean): boolean {
  if (!isIssueOpen) return false
  let { finalVersion } = article
  return finalVersion === null || finalVersion.authors.some((author) => !isAgreed(author.state))
}

const NOTHING_CHANGED = 'Nic se nezměnilo.'
const NOTHING_CHANGED_OR_SENT = tied`Nic se nezměnilo a nic neodešlo.`
const DISCONNECTED_STEP = tied`Nejdřív v Nastavení připojte účet publikace.app@vednemesicnik.cz.`
const FOLDER_MISSING_STEP = tied`Obnovte složku článku z koše, nebo ji vraťte na sdílený disk Publikace.`

/* ---------- Přejmenovat článek (`12x`) ---------- */

export const RENAME_ARTICLE_TITLE = 'Přejmenovat článek'
export const RENAME_ARTICLE_CONFIRM_LABEL = 'Přejmenovat článek'
/* Formed as `12v`'s _Vydání se přejmenovává…_; `12x` draws no pending state. */
export const RENAME_ARTICLE_PENDING_LABEL = 'Článek se přejmenovává…'

export const RENAME_ARTICLE_TEXT: readonly [string, string] = [
  tied`Přejmenuje se i dokument Google a složka článku. Nový název článku se v Evidenci může objevit později.`,
  tied`Text v dokumentu se nezmění: pokud je v něm název napsaný, opravte ho tam. Nikomu se nic nepošle.`,
]

export const ARTICLE_RENAMED_TOAST = 'Článek je přejmenovaný.'
export const ARTICLE_RENAMED_MEANWHILE_TOAST = tied`Článek se mezitím přejmenoval. Vaše změna se neuložila.`

/** A toast with the line under it, as `flashToast` takes them. */
export type ToastText = { detail?: string; message: string }

/** The marking, with who made it and when, which the row under the toast already shows. */
function finalVersionLine(step: ArticleStep, today: Temporal.Instant): string {
  return `Finální verze z ${formatMoment(step.at, today)} · ${whoOf(step)}`
}

export function renameTooLateToast(step: ArticleStep, today: Temporal.Instant): ToastText {
  return {
    detail: finalVersionLine(step, today),
    message: tied`Článek už má finální verzi. Přejmenovat ho nejde.`,
  }
}

export const RENAME_ARTICLE_UNAVAILABLE: FixCallout = {
  text: [tied`${NOTHING_CHANGED} Disk teď neodpovídá.`],
  title: [tied`Zkuste článek přejmenovat za chvíli znovu.`],
}

export const RENAME_ARTICLE_DISCONNECTED: FixCallout = {
  text: [NOTHING_CHANGED],
  title: [DISCONNECTED_STEP],
}

export const RENAME_ARTICLE_FOLDER_MISSING: FixCallout = {
  text: [NOTHING_CHANGED],
  title: [FOLDER_MISSING_STEP],
}

export const RENAME_ARTICLE_DOC_MISSING: FixCallout = {
  text: [NOTHING_CHANGED],
  title: [tied`Obnovte dokument z koše, nebo ho vraťte na sdílený disk Publikace.`],
}

/**
 * `_meta.json` in the bin while the folder and the Doc are there (`12x`, `12y`): every such file
 * is named alike, so the step links the one by its ID and the screen never names the file
 * (3g1bxiwh).
 */
function metaBinnedStep(href: string): CalloutPart[] {
  return ['Otevřete ', { href, text: 'soubor pro tento článek' }, tied` a obnovte ho z koše.`]
}

export function renameArticleMetaBinned(href: string): FixCallout {
  return { text: [NOTHING_CHANGED], title: metaBinnedStep(href) }
}

/* ---------- Upravit autory (`12y`) ---------- */

export const EDIT_AUTHORS_TITLE = 'Upravit autory'
export const SAVE_AUTHORS_LABEL = 'Uložit autory'
/* `12y` draws no pending state; the cards above it say what is saved. */
export const SAVE_AUTHORS_PENDING_LABEL = 'Ukládá se…'
export const AGREED_AUTHOR_TAG = AGREED_CLAUSE_LABEL

/** The line under the title: which article, and after the final version what may change. */
export function editAuthorsLead(articleName: string, hasFinalVersion: boolean): string {
  return hasFinalVersion
    ? tied`Článek „${articleName}“ má finální verzi. Upravit lze jen údaje u autorů bez souhlasu.`
    : tied`Článek „${articleName}“`
}

/** Above the buttons, where the editor decides (`12y`): what saving sends, and to whom. */
export function editAuthorsNote(hasFinalVersion: boolean): string {
  return hasFinalVersion
    ? tied`Při příštím běhu úlohy odejde žádost o souhlas s redakční doložkou s opravenými údaji. Pokud už dřívější žádost odešla, odpověď na ni se nezapočítá. Kvůli opravě se ostatním nic nepošle.`
    : tied`Po uložení odejde na každou novou nebo opravenou adresu uvítací e-mail s odkazem na dokument. Na odebrané adresy nic neodejde. Kdo už odkaz z uvítání má, může dokument dál upravovat.`
}

export const AUTHORS_SAVED_TOAST = tied`Údaje o autorech jsou uložené.`

/** `na 2 adresy`, `na 5 adres`. */
function addressCount(count: number): string {
  return `${count} ${count >= 5 ? 'adres' : 'adresy'}`
}

/**
 * Before the final version: the toast names where the welcome went, or tells the editor to send
 * the link where the Mailer did not confirm it, with the addresses under it (`12y`). A welcome
 * that did not go is not tried again, so the step is the editor's.
 */
export function authorsSavedToast(
  sent: readonly string[],
  failed: readonly string[],
): ToastText & { isError: boolean } {
  if (failed.length > 0) {
    let where = failed.length === 1 ? 'na adresu uvedenou níže' : 'na adresy uvedené níže'
    return {
      detail: failed.join(', '),
      isError: true,
      message: tied`Pošlete odkaz na dokument ${where}. Údaje o autorech jsou uložené. Odeslání uvítacího e-mailu se nepodařilo potvrdit.`,
    }
  }
  if (sent.length === 0) return { isError: false, message: AUTHORS_SAVED_TOAST }
  return {
    detail: `Uvítací e-mail odešel na ${sent.length === 1 ? sent[0] : addressCount(sent.length)}`,
    isError: false,
    message: AUTHORS_SAVED_TOAST,
  }
}

export const CLAUSES_CORRECTED_TOAST = tied`Údaje jsou opravené. Žádost o souhlas s redakční doložkou čeká na odeslání.`

export function agreedMeanwhileToast(
  authorName: string,
  agreedAt: Temporal.Instant | null,
  today: Temporal.Instant,
): ToastText {
  return {
    ...(agreedAt === null ? {} : { detail: formatMoment(agreedAt, today) }),
    message: tied`${authorName} už souhlasí. Vaše změny se neuložily.`,
  }
}

export const FINAL_VERSION_MEANWHILE_TOAST = tied`Článek už má finální verzi. Vaše změny se neuložily.`
export const FINAL_VERSION_CANCELLED_TOAST = tied`Finální verze už je zrušená. Vaše změny se neuložily.`

export const AUTHORS_UNAVAILABLE: FixCallout = {
  text: [tied`${NOTHING_CHANGED_OR_SENT} Disk teď neodpovídá.`],
  title: [tied`Zkuste autory uložit za chvíli znovu.`],
}

export const AUTHORS_DISCONNECTED: FixCallout = {
  text: [NOTHING_CHANGED_OR_SENT],
  title: [DISCONNECTED_STEP],
}

export const AUTHORS_FOLDER_MISSING: FixCallout = {
  text: [NOTHING_CHANGED_OR_SENT],
  title: [FOLDER_MISSING_STEP],
}

export function authorsMetaBinned(href: string): FixCallout {
  return { text: [NOTHING_CHANGED_OR_SENT], title: metaBinnedStep(href) }
}

/**
 * A fix on an article of an issue closed meanwhile, as `12h` reads: one sentence per action,
 * since the Doc stays editable after the close and only the fix is refused.
 */
export function articleRenameClosedToast(issueName: string): string {
  return tied`Vydání ${issueName} je uzavřené. Článek už nejde přejmenovat.`
}

export function authorsClosedToast(issueName: string): string {
  return tied`Vydání ${issueName} je uzavřené. Údaje o autorech už nejde uložit.`
}
