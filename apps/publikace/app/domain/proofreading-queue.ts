/**
 * The page Korektura (`15a`–`15e`): every article of every open issue before its final version,
 * in four parts, and the steps a proofreader takes on it, worded as the copywriter settled them
 * (`tlb36tk0`). A proofreader sees only what the work needs: the name, the issue, the authors by
 * name, the Doc and the state (`sh0zp1if`).
 */

import {
  type ArticleProgress,
  type ArticleStep,
  articleState,
  isMarked as isMarkedState,
  whoOf,
} from './article.ts'
import { alreadyProofreadingToast, type RaceToast } from './handover.ts'
import { tied } from './public/typography.ts'
import { formatMoment } from './time.ts'

export const PROOFREADING_TITLE = 'Korektura'

/** The lead under the title; the second sentence only for whoever may take a text (`15b`). */
export function queueLead(canTake: boolean): string {
  return canTake
    ? tied`Články ze všech otevřených vydání. Než začnete opravovat, zvolte u článku Vzít si korekturu.`
    : tied`Články ze všech otevřených vydání.`
}

export type QueuePart = 'mine' | 'others' | 'waiting' | 'writing'

/** The fixed order of the parts: what the proofreader started, what waits, others', the exception. */
export const PART_ORDER: readonly QueuePart[] = ['mine', 'waiting', 'others', 'writing']

export const PART_TITLES: Readonly<Record<QueuePart, string>> = {
  mine: 'Moje korektury',
  others: 'V korektuře',
  waiting: 'Čeká na korekturu',
  writing: 'Ještě se píšou',
}

/** Under _Čeká na korekturu_ when nothing waits: the part stands, as the proofreader came for it. */
export const NOTHING_WAITING = tied`Žádný článek teď nečeká na korekturu.`

/** Over _Ještě se píšou_; the second sentence only for whoever may take a text (`15b`). */
export function writingNote(canTake: boolean): string {
  return canTake
    ? tied`Tyto články šéfredakce zatím nepředala ke korektuře. Korekturu si vezměte, jen pokud víte, že je článek dopsaný.`
    : tied`Tyto články šéfredakce zatím nepředala ke korektuře.`
}

export const TAKE_LABEL = 'Vzít si korekturu'
export const CANCEL_LABEL = 'Zrušit korekturu'

export const EMPTY_TITLE = tied`Nic ke korektuře`
/** A proofreader has no step in the app before a handover, so the sentence says where work comes from. */
export const EMPTY_TEXT_PROOFREADER = tied`Až šéfredakce předá článek ke korektuře, objeví se tady.`
export const EMPTY_TEXT_EDITOR = tied`Články předáte ke korektuře v detailu vydání.`
export const EMPTY_ACTION_EDITOR = 'Přejít na vydání'

/** `10d`: an editors' screen opened by a proofreader who is not an editor-in-chief. */
export const EDITORS_ONLY_TITLE = tied`Sem má přístup jen šéfredakce`
export const TO_PROOFREADING_LABEL = 'Přejít na Korekturu'

export function issueKind(issueName: string): string {
  return tied`Vydání ${issueName}`
}

export function authorsMeta(authors: readonly string[]): string {
  return tied`Autoři: ${authors.join(', ')}`
}

/** The Callout over the parts for a link from the digest to an article of a closed issue (`15e`). */
export function closedArticleCallout(articleName: string, issueName: string) {
  return {
    text: tied`Vydání ${issueName} je uzavřené.`,
    title: `„${articleName}“` as string | null,
  }
}

/**
 * The same Callout for an article past its proofreading, one sentence without a title (`15e`). It
 * does not name the step, which a proofreader or an editor-in-chief may have taken.
 */
export function finishedArticleCallout(articleName: string) {
  return { text: tied`Korektura článku „${articleName}“ je hotová.`, title: null as string | null }
}

export type QueueViewer = { email: string; isEditor: boolean; isProofreader: boolean }

export type QueueItem = ArticleProgress & {
  cancelledProofreading: ArticleStep | null
  id: number
}

/**
 * Where an article stands on the page for this viewer, from its state alone, or `null` where it
 * does not stand at all. An article past its final version stays in the _Moje korektury_ of the
 * proofreader whose take it was while the marking can still be cancelled, and nobody else sees
 * it (`15g`). A new version that replaced one is the editors-in-chief's step, so it never comes
 * back here (`12s`).
 */
export function partOf(article: QueueItem, viewer: QueueViewer): QueuePart | null {
  let isOwn = viewer.isProofreader && article.proofreading?.email === viewer.email
  switch (articleState(article)) {
    case 'approved':
    case 'consent':
    case 'error':
    case 'review':
    case 'revised': {
      let finalVersion = article.finalVersion ?? null
      let isOwnMarking = finalVersion?.isCancellable === true && !finalVersion.isReplacement
      return isOwn && isOwnMarking ? 'mine' : null
    }
    case 'proofreading':
      return isOwn ? 'mine' : 'others'
    case 'handedOver':
      return 'waiting'
    case 'writing':
      return 'writing'
  }
}

/**
 * The time a part orders by, the oldest first (`15a`): the handover in _Čeká_, the take in the
 * two parts of takes, the creation in _Ještě se píšou_. A card kept in a part it left has the
 * same time it had there, so it does not move.
 */
function orderKey(article: QueueItem, part: QueuePart): number {
  let at =
    part === 'waiting'
      ? article.handover?.at
      : part === 'writing'
        ? undefined
        : (article.proofreading ?? article.cancelledProofreading)?.at
  return (at ?? article.createdAt).epochMilliseconds
}

/**
 * The articles in their parts. `settled` is the card just taken or cancelled, kept for one load
 * in the part it was in, so the next card does not move under the hand (`15d`, as `13b`).
 */
export function queueParts<Item extends QueueItem>(
  articles: readonly Item[],
  viewer: QueueViewer,
  settled: { id: number; part: QueuePart } | null = null,
): Record<QueuePart, Item[]> {
  let parts: Record<QueuePart, Item[]> = { mine: [], others: [], waiting: [], writing: [] }
  for (let article of articles) {
    let part = settled?.id === article.id ? settled.part : partOf(article, viewer)
    if (part === null) continue
    if (part === 'mine' && !viewer.isProofreader) part = 'others'
    parts[part].push(article)
  }
  /* In _Moje korektury_ the marked articles stand after the takes: they ask for nothing more. */
  let isMarked = (article: QueueItem) => Number((article.finalVersion ?? null) !== null)
  for (let part of PART_ORDER) {
    parts[part].sort(
      (a, b) =>
        isMarked(a) - isMarked(b) ||
        orderKey(a, part) - orderKey(b, part) ||
        a.createdAt.epochMilliseconds - b.createdAt.epochMilliseconds ||
        a.id - b.id,
    )
  }
  return parts
}

/**
 * What the viewer may do on a card (`15a`, `15b`, `15f`, `15g`): take it, cancel the take, mark
 * its final version or cancel the marking. The proofreader marks their own take with the card's
 * button; an editor-in-chief marks anybody else's from „⋯“, for a proofreader who dropped out.
 * Whoever may mark may cancel, while no run of the job has taken a clause.
 */
export function cardActions(
  article: QueueItem,
  viewer: QueueViewer,
): {
  canCancel: boolean
  canCancelFinal: boolean
  canMarkFinal: boolean
  canMarkFinalForOther: boolean
  canTake: boolean
} {
  let state = articleState(article)
  let isOwn = article.proofreading?.email === viewer.email
  let isOwnTake = viewer.isProofreader && isOwn
  let isFinal = isMarkedState(state)
  return {
    canCancel: state === 'proofreading' && (isOwnTake || viewer.isEditor),
    canCancelFinal:
      isFinal && article.finalVersion?.isCancellable === true && (isOwnTake || viewer.isEditor),
    canMarkFinal: state === 'proofreading' && isOwnTake,
    canMarkFinalForOther: state === 'proofreading' && !isOwnTake && viewer.isEditor,
    canTake: state === 'writing' || state === 'handedOver' ? viewer.isProofreader : false,
  }
}

/* The toasts of `15d`. */

export const TAKEN_TOAST = tied`Teď máte korekturu na starosti vy.`

/** After a cancel, where the article went back to. */
export function cancelledToast(isHandedOver: boolean): string {
  return isHandedOver
    ? tied`Článek znovu čeká na korekturu.`
    : tied`Článek je zpět ve stavu Píše se.`
}

export const TAKE_FAILED_TOAST = tied`Zkuste si korekturu za chvíli vzít znovu.`
export const CANCEL_FAILED_TOAST = tied`Zkuste korekturu za chvíli zrušit znovu. Článek zůstává v korektuře.`
export const NO_LONGER_PROOFREADER_TOAST = tied`Váš účet už není mezi korektory.`

/** What stood in the way of a step, as `15d` says it: nothing changed, so no _Vrátit_. */
export type QueueRefusal =
  | { kind: 'closed'; issueName: string }
  | { kind: 'handover-cancelled' }
  | { kind: 'not-proofreading' }
  | { kind: 'proofreading'; step: ArticleStep }
  | { kind: 'final-version'; step: ArticleStep }

export function takeRefusalToast(refusal: QueueRefusal): RaceToast {
  switch (refusal.kind) {
    case 'final-version':
      /* A marking is minutes old when it meets a take's step: its own year is the one to read. */
      return finalAlreadyMarkedToast(refusal.step, refusal.step.at)
    case 'closed':
      return { message: tied`Vydání ${refusal.issueName} je uzavřené. Korekturu už si nelze vzít.` }
    case 'handover-cancelled':
      return { message: tied`Šéfredakce mezitím zrušila předání. Článek nemáte v korektuře.` }
    case 'not-proofreading':
      return { message: tied`Korektura už je zrušená.` }
    case 'proofreading':
      return alreadyProofreadingToast(refusal.step)
  }
}

export function cancelRefusalToast(refusal: QueueRefusal): RaceToast {
  return refusal.kind === 'closed'
    ? { message: tied`Vydání ${refusal.issueName} je uzavřené. Korekturu už nelze zrušit.` }
    : takeRefusalToast(refusal)
}

/*
 * The final version (`15f`, `15g`, `12q`), worded as the copywriter settled it (`m8jy13rx`, and
 * `qqdbrrms` for when it can no longer be cancelled).
 * The texts say nothing of the job's next run: the line that bounds a cancel is the moment a run
 * takes a clause, which no estimate can tell, and a proofreader never reads the word _úloha_.
 */

export const MARK_FINAL_LABEL = 'Označit finální verzi…'
export const MARK_FINAL_CONFIRM_LABEL = 'Označit finální verzi'
export const MARKING_FINAL_LABEL = 'Ukládá se finální verze…'
export const CANCEL_FINAL_LABEL = 'Zrušit finální verzi'
export const OPEN_PDF_LABEL = 'Otevřít PDF'
export const DIALOG_CANCEL_LABEL = 'Zrušit'
export const MARK_FINAL_DIALOG_TITLE = 'Označit finální verzi?'

/** The button's name starts with its visible text and carries the article's (`15f`). */
export function markFinalButtonLabel(articleName: string): string {
  return tied`Označit finální verzi článku ${articleName}`
}

/** The dialog's paragraphs, the signatures under the second as a list of their own. */
export function markFinalDialogText(articleName: string): string {
  return tied`Dokument „${articleName}“ se uloží jako PDF tak, jak je teď.`
}
export const MARK_FINAL_DIALOG_MAIL = tied`Každému autorovi se pošle PDF s žádostí o souhlas s redakční doložkou.`
export function signaturesLabel(count: number): string {
  return count === 1 ? tied`Jméno v doložce` : tied`Jména v doložkách`
}
export const MARK_FINAL_DIALOG_CANCEL = tied`Jakmile se začnou odesílat e-maily autorům, finální verzi už nezrušíte.`

/** A Callout in the dialog: the step first, the result under it (`11c`). */
export type DialogError = { text: string; title: string }

export const FINAL_DRIVE_DOWN: DialogError = {
  text: tied`Nic se neuložilo. Disk teď neodpovídá.`,
  title: tied`Zkuste finální verzi za chvíli označit znovu.`,
}
export const FINAL_ACCOUNT_EDITOR: DialogError = {
  text: tied`Nic se neuložilo.`,
  title: tied`Nejdřív v Nastavení připojte účet publikace.app@vednemesicnik.cz.`,
}
export const FINAL_ACCOUNT_PROOFREADER: DialogError = {
  text: tied`Účet aplikace je odpojený. Nic se neuložilo.`,
  title: tied`Dejte vědět šéfredakci.`,
}
export const FINAL_FOLDER_EDITOR: DialogError = {
  text: tied`Nic se neuložilo.`,
  title: tied`Obnovte složku z koše nebo ji vraťte na sdílený disk Publikace.`,
}
export const FINAL_DOC_EDITOR: DialogError = {
  text: tied`Nic se neuložilo.`,
  title: tied`Obnovte dokument z koše nebo ho vraťte na sdílený disk Publikace.`,
}
export const FINAL_FOLDER_PROOFREADER: DialogError = {
  text: tied`Na Disku chybí složka článku. Nic se neuložilo.`,
  title: tied`Dejte vědět šéfredakci.`,
}
export const FINAL_DOC_PROOFREADER: DialogError = {
  text: tied`Na Disku chybí dokument článku. Nic se neuložilo.`,
  title: tied`Dejte vědět šéfredakci.`,
}

/** The Callout for what Drive stopped, worded for the editors-in-chief or for a proofreader. */
export function finalDialogError(
  kind: 'account' | 'doc-missing' | 'folder-missing' | 'unavailable',
  isEditor: boolean,
): DialogError {
  switch (kind) {
    case 'account':
      return isEditor ? FINAL_ACCOUNT_EDITOR : FINAL_ACCOUNT_PROOFREADER
    case 'doc-missing':
      return isEditor ? FINAL_DOC_EDITOR : FINAL_DOC_PROOFREADER
    case 'folder-missing':
      return isEditor ? FINAL_FOLDER_EDITOR : FINAL_FOLDER_PROOFREADER
    case 'unavailable':
      return FINAL_DRIVE_DOWN
  }
}

export const FINAL_SAVED_TOAST = tied`Finální verze je uložená.`
export const FINAL_CANCELLED_TOAST = tied`Článek je zpět v korektuře.`
export const FINAL_TOO_LATE_TOAST = tied`Odesílání e-mailů už začalo. Finální verzi nelze zrušit.`
export const CANCEL_FINAL_FAILED_TOAST = tied`Zkuste finální verzi hned zrušit znovu. Na zrušení může zbývat jen chvíle.`
export const FINAL_ALREADY_CANCELLED_TOAST = tied`Finální verze už je zrušená.`

/** Marked meanwhile by somebody else, or twice by the same hand: who and when (`15g`). */
export function finalAlreadyMarkedToast(step: ArticleStep, today: Temporal.Instant): RaceToast {
  return {
    detail: tied`${formatMoment(step.at, today)} · ${whoOf(step)}`,
    message: tied`Finální verze už je označená.`,
  }
}

/** What stood in the way of marking or cancelling the final version: nothing was written. */
export type FinalRefusal =
  | { kind: 'closed'; issueName: string }
  | { kind: 'final-version'; step: ArticleStep }
  | { kind: 'not-final' }
  | { kind: 'not-proofreading'; isEditor: boolean }
  | { kind: 'proofreading'; step: ArticleStep }
  | { kind: 'too-late' }

export function markFinalRefusalToast(refusal: FinalRefusal, today: Temporal.Instant): RaceToast {
  switch (refusal.kind) {
    case 'closed':
      return {
        message: tied`Vydání ${refusal.issueName} je uzavřené. Finální verzi už nelze označit.`,
      }
    case 'final-version':
      return finalAlreadyMarkedToast(refusal.step, today)
    case 'not-proofreading':
      /* An editor-in-chief marking for a proofreader learns the take is gone; the proofreader
         learns an editor-in-chief cancelled it, as only one can cancel somebody's take. */
      return refusal.isEditor
        ? { message: tied`Korektura už je zrušená.` }
        : { message: tied`Šéfredakce mezitím zrušila korekturu. Článek nemáte v korektuře.` }
    case 'proofreading':
      return alreadyProofreadingToast(refusal.step)
    case 'not-final':
      return { message: FINAL_ALREADY_CANCELLED_TOAST }
    case 'too-late':
      return { message: FINAL_TOO_LATE_TOAST }
  }
}

export function cancelFinalRefusalToast(refusal: FinalRefusal, today: Temporal.Instant): RaceToast {
  if (refusal.kind === 'closed') {
    return {
      message: tied`Vydání ${refusal.issueName} je uzavřené. Finální verzi už nelze zrušit.`,
    }
  }
  return markFinalRefusalToast(refusal, today)
}
