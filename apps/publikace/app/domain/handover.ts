/**
 * Handing an article over to proofreading in the issue detail (`12k`, `12l`), as the copywriter
 * worded it (`tlb36tk0`). Only the editors-in-chief hand over and cancel, at once and without a
 * dialog: nothing is sent at the click, and the morning digest tells the proofreaders (`12n`), so
 * the toast's _Vrátit_ stands where a confirmation would (`ojfczb2m`).
 */

import { type ArticleStep, whoOf } from './article.ts'
import { tied } from './public/typography.ts'
import { formatDayMonth, formatMoment } from './time.ts'

export const HAND_OVER_LABEL = 'Předat ke korektuře'
export const HANDING_OVER_LABEL = 'Předávání…'
/** Without „…“: no dialog follows (`12k`). */
export const CANCEL_HANDOVER_LABEL = 'Zrušit předání'

/** Starts with the visible label, so a voice command by what is seen still finds it (`12k`). */
export function handOverButtonLabel(articleName: string): string {
  return tied`Předat ke korektuře článek ${articleName}`
}

export const HANDED_OVER_TOAST = tied`Článek je předaný ke korektuře.`
export const HANDOVER_CANCELLED_TOAST = tied`Předání je zrušené.`

/** A toast that says what somebody else did meanwhile, and under it who and when (`12l`). */
export type RaceToast = { detail?: string; message: string }

/** Another editor-in-chief handed it over meanwhile: nothing is written twice. */
export function alreadyHandedOverToast(step: ArticleStep, today: Temporal.Instant): RaceToast {
  return {
    detail: tied`${formatMoment(step.at, today)} · ${whoOf(step)}`,
    message: tied`Článek už je předaný ke korektuře.`,
  }
}

/** A proofreader took it straight from _Píše se_ meanwhile, in the shape of its tag. */
export function alreadyProofreadingToast(step: ArticleStep): RaceToast {
  return {
    detail: tied`od ${formatDayMonth(step.at)} · ${whoOf(step)}`,
    message: tied`Korektura už probíhá.`,
  }
}

/** Cancelling what a proofreader took meanwhile: one sentence, its data inside it. */
export function cancelTooLateToast(step: ArticleStep): RaceToast {
  return {
    message: tied`Předání už nelze zrušit. Korektura probíhá od ${formatDayMonth(step.at)} · ${whoOf(step)}.`,
  }
}

export const ALREADY_CANCELLED_TOAST: RaceToast = { message: tied`Předání už je zrušené.` }

/** The issue was closed meanwhile; the page then has no actions on its articles (`12h`). */
export function closedHandOverToast(issueName: string): string {
  return tied`Vydání ${issueName} je uzavřené. Článek už nelze předat ke korektuře.`
}

/** A draft of the drawing that the copywriter has not seen yet (`12l`). */
export function closedCancelToast(issueName: string): string {
  return tied`Vydání ${issueName} je uzavřené. Předání už nelze zrušit.`
}

/** The write failed. The row still shows _Píše se_ with its button, so no result is said. */
export const HAND_OVER_FAILED_TOAST = tied`Zkuste článek za chvíli předat znovu.`
/** „Zrušit znovu“ alone could read as if the first try cancelled something. */
export const CANCEL_FAILED_TOAST = tied`Zkuste předání za chvíli zrušit znovu. Článek dál čeká na korekturu.`

/**
 * The warning while the proofreaders have no address (`12l`, `14e`): the step for an
 * administrator, who changes the address, and the person to ask for everybody else (`tlb36tk0`).
 */
export function missingAddressTitle(isAdmin: boolean): string {
  return isAdmin
    ? tied`Doplňte adresu korektorů.`
    : tied`Požádejte správce o doplnění adresy korektorů.`
}

/** Under the title in the issue detail, over the articles it concerns (`12l`). */
export const MISSING_ADDRESS_ARTICLES_TEXT = tied`Bez adresy ranní přehled neodejde.`
/** Under the title over the digest's history (`14e`). */
export const MISSING_ADDRESS_JOB_TEXT = tied`Bez adresy přehled neodejde. Články můžete dál předávat ke korektuře.`
export const TO_SETTINGS_LABEL = 'Do Nastavení'
