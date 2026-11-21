/**
 * The page Korektura (`15a`–`15e`): every article of every open issue before its final version,
 * in four parts, and the steps a proofreader takes on it, worded as the copywriter settled them
 * (`tlb36tk0`). A proofreader sees only what the work needs: the name, the issue, the authors by
 * name, the Doc and the state (`sh0zp1if`).
 */

import { type ArticleProgress, type ArticleStep, articleState } from './article.ts'
import { alreadyProofreadingToast, type RaceToast } from './handover.ts'
import { tied } from './public/typography.ts'

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
  return { text: tied`Vydání ${issueName} je uzavřené.`, title: `„${articleName}“` }
}

export type QueueViewer = { email: string; isEditor: boolean; isProofreader: boolean }

export type QueueItem = ArticleProgress & {
  cancelledProofreading: ArticleStep | null
  id: number
}

/** Where an article stands on the page for this viewer, from its state alone. */
export function partOf(article: QueueItem, viewer: QueueViewer): QueuePart {
  switch (articleState(article)) {
    case 'proofreading':
      return viewer.isProofreader && article.proofreading?.email === viewer.email
        ? 'mine'
        : 'others'
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
    if (part === 'mine' && !viewer.isProofreader) part = 'others'
    parts[part].push(article)
  }
  for (let part of PART_ORDER) {
    parts[part].sort(
      (a, b) =>
        orderKey(a, part) - orderKey(b, part) ||
        a.createdAt.epochMilliseconds - b.createdAt.epochMilliseconds ||
        a.id - b.id,
    )
  }
  return parts
}

/** What the viewer may do on a card: take it, cancel the take, or neither (`15a`, `15b`). */
export function cardActions(
  article: QueueItem,
  viewer: QueueViewer,
): { canCancel: boolean; canTake: boolean } {
  let state = articleState(article)
  let isOwn = article.proofreading?.email === viewer.email
  return {
    canCancel: state === 'proofreading' && ((viewer.isProofreader && isOwn) || viewer.isEditor),
    canTake: state !== 'proofreading' && viewer.isProofreader,
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

export function takeRefusalToast(refusal: QueueRefusal): RaceToast {
  switch (refusal.kind) {
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

/** The closed issue's sentence is a draft of the drawing that the copywriter has not seen. */
export function cancelRefusalToast(refusal: QueueRefusal): RaceToast {
  return refusal.kind === 'closed'
    ? { message: tied`Vydání ${refusal.issueName} je uzavřené. Korekturu už nelze zrušit.` }
    : takeRefusalToast(refusal)
}
