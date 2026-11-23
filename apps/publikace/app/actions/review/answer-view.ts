import type { AnswerRow } from '../../data/answers.server.ts'
import {
  ANSWER_MAX_LENGTH,
  answerCallout,
  answerFieldLabel,
  answerHint,
  type AnswerKind,
  answerMeta,
  type AnswerRefusal,
  answersTitle,
  CANCEL_ANSWER_LABEL,
  isInFlight,
  CLOSE_ANSWER_LABEL,
  LOCKED_ANSWER_HINT,
  RETRY_ANSWER_LABEL,
  SEND_ANSWER_LABEL,
  SENDING_ANSWER_LABEL,
  SIGNATURE_NEWSROOM,
  UNCONFIRMED_ANSWER_LINE,
} from '../../domain/answer.ts'
import type { QueueCardAnswer, QueueCardAnswers } from './queue-card.tsx'

/**
 * What a send handed back to the card through the redirect, once: the form open again, the text
 * the editor typed where nothing stores it, and why it did not go (`13e`).
 */
export type ComposeFlash = {
  anchor: string
  error?: string
  refusal?: Extract<AnswerRefusal, 'daily-cap' | 'newer-reply' | 'taken'>
  text?: string
}

const FLASH_REFUSALS = new Set(['daily-cap', 'newer-reply', 'taken'])

/** The flash as it was left, or `null` for anything else in its place. */
export function composeFlashOf(value: unknown): ComposeFlash | null {
  if (typeof value !== 'object' || value === null) return null
  let { anchor, error, refusal, text } = value as Record<string, unknown>
  if (typeof anchor !== 'string') return null
  let flash: ComposeFlash = { anchor }
  if (typeof error === 'string') flash.error = error
  if (typeof refusal === 'string' && FLASH_REFUSALS.has(refusal)) {
    flash.refusal = refusal as ComposeFlash['refusal']
  }
  if (typeof text === 'string') flash.text = text
  return flash
}

export type AnswerViewInput = {
  /** Where a new answer posts, and where a retry of the stored one does. */
  actions: { retry: string; send: string }
  anchor: string
  /** The answers of the card, newest first. */
  answers: readonly AnswerRow[]
  closeHref: string
  email: string
  flash: ComposeFlash | null
  /** `?reply=` names this card. */
  isRequested: boolean
  issueName: string
  kind: AnswerKind
  /** The reply the card shows. */
  messageId: string
  openHref: string | null
  signatureName: string | null
  today: Temporal.Instant
}

/**
 * The form on a card that waits on a decision (`13d`, `13e`). An answer to the card's reply that
 * is on record and did not go locks the form for every editor-in-chief, so nobody writes a second
 * one blind: its text, sent again as it is, or only shown to be copied once the post refused it.
 */
export function answerFormOf(input: AnswerViewInput): QueueCardAnswer {
  let { anchor, flash, kind } = input
  let context = { email: input.email, issueName: input.issueName, kind }
  let current = input.answers.find(
    (answer) => answer.inReplyToMessageId === input.messageId && answer.sentAt === null,
  )
  let isOpen = input.isRequested || flash !== null
  let base = {
    anchor,
    closeHref: input.closeHref,
    error: null,
    label: answerFieldLabel(kind),
    maxLength: ANSWER_MAX_LENGTH,
    messageId: input.messageId,
    newsroom: SIGNATURE_NEWSROOM,
    openHref: input.openHref,
    pendingLabel: SENDING_ANSWER_LABEL,
    signatureName: input.signatureName,
  }

  if (current !== undefined && current.refusedAt !== null) {
    return {
      ...base,
      action: input.actions.send,
      answerId: null,
      callout: answerCallout('refused', context),
      closeLabel: CLOSE_ANSWER_LABEL,
      hint: '',
      isOpen,
      mode: 'closed',
      submitLabel: SEND_ANSWER_LABEL,
      text: current.text,
    }
  }
  if (current !== undefined) {
    /* A retry the daily cap stopped says so; one the Mailer never confirmed says that. While the
       Mailer may still be sending, the text is shown and nothing can be sent again. */
    let refusal: 'daily-cap' | 'unconfirmed' | null =
      flash?.refusal === 'daily-cap'
        ? 'daily-cap'
        : current.failedAt === null
          ? null
          : 'unconfirmed'
    return {
      ...base,
      action: input.actions.retry,
      answerId: current.id,
      callout: refusal === null ? null : answerCallout(refusal, context),
      closeLabel: CLOSE_ANSWER_LABEL,
      hint: LOCKED_ANSWER_HINT,
      isOpen,
      mode: isInFlight(current, input.today) ? 'closed' : 'unconfirmed',
      submitLabel: RETRY_ANSWER_LABEL,
      text: current.text,
    }
  }
  return {
    ...base,
    action: input.actions.send,
    answerId: null,
    callout:
      flash?.refusal === undefined || flash.refusal === 'taken'
        ? null
        : answerCallout(flash.refusal, context),
    closeLabel: CANCEL_ANSWER_LABEL,
    error: flash?.error ?? null,
    hint: answerHint(kind, input.signatureName !== null),
    isOpen,
    mode: 'write',
    submitLabel: SEND_ANSWER_LABEL,
    text: flash?.text ?? '',
  }
}

/**
 * The card just answered by somebody else while this editor wrote (`13e`): the text that did not
 * go, locked, to be copied, with only _Zavřít_.
 */
export function takenFormOf(input: AnswerViewInput): QueueCardAnswer {
  return {
    action: input.actions.send,
    anchor: input.anchor,
    answerId: null,
    callout: answerCallout('taken', {
      email: input.email,
      issueName: input.issueName,
      kind: input.kind,
    }),
    closeHref: input.closeHref,
    closeLabel: CLOSE_ANSWER_LABEL,
    error: null,
    hint: '',
    isOpen: true,
    label: answerFieldLabel(input.kind),
    maxLength: ANSWER_MAX_LENGTH,
    messageId: input.messageId,
    mode: 'closed',
    newsroom: SIGNATURE_NEWSROOM,
    openHref: null,
    pendingLabel: SENDING_ANSWER_LABEL,
    signatureName: input.signatureName,
    submitLabel: SEND_ANSWER_LABEL,
    text: input.flash?.text ?? '',
  }
}

/**
 * The answers that went from the app, under the quote: on the card just answered every one, open,
 * so it shows what went (`13e`); on a card back in the queue those before the message it quotes,
 * closed, so the card grows only on request (`13f`). An answer the Mailer never confirmed is
 * listed once a newer message overtook it, since it may have gone; one the post refused is not.
 */
export function answersListOf(
  answers: readonly AnswerRow[],
  options: { isJustAnswered: boolean; messageId: string; today: Temporal.Instant },
): QueueCardAnswers | null {
  let shown = answers.filter((answer) => {
    if (answer.sentAt !== null) {
      return options.isJustAnswered || answer.inReplyToMessageId !== options.messageId
    }
    return answer.failedAt !== null && answer.inReplyToMessageId !== options.messageId
  })
  if (shown.length === 0) return null
  return {
    isOpen: options.isJustAnswered,
    items: shown.map((answer) => ({
      line: answer.sentAt === null ? UNCONFIRMED_ANSWER_LINE : null,
      meta: answerMeta(answer.sentAt ?? answer.startedAt, answer.editorName, options.today),
      text: answer.text,
    })),
    title: answersTitle(shown.length, !options.isJustAnswered),
  }
}
