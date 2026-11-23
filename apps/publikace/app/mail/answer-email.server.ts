import { type AnswerKind, quoteIntro, SIGNATURE_NEWSROOM } from '../domain/answer.ts'
import { keepOneLetterWords } from '../domain/public/typography.ts'
import {
  ASSOCIATION_ID,
  ASSOCIATION_NAME,
  escapeHtml,
  htmlDocument,
  PARAGRAPH_STYLE,
  SENDER_NAME,
  SMALL_STYLE,
} from './association.server.ts'
import { CONSENT_QUESTION_LINE, CONSENT_REASON_LINE } from './consent-email.server.ts'
import type { MailMessage } from './mailer.server.ts'

/**
 * Why an author got the e-mail, word for word as the e-mail with the final version ends (`20f`),
 * because the answer belongs to that conversation.
 */
export const ARTICLE_REASON_LINE =
  'Tento e-mail jsme vám poslali, protože tato adresa je uvedená u vašeho jména mezi autory článku.'

/*
 * The quote as Gmail draws one, in fixed colours written into the HTML: charcoal-300 for the rule
 * and charcoal-600 for the text, as the frame of `21c` is written (`13h`).
 */
const QUOTE_STYLE =
  'margin:0;padding:0 0 0 12px;border-left:1px solid #CAD5E2;color:#4B5563;font-size:15px;line-height:1.6'

export type AnswerDetails = {
  idempotencyKey: string
  kind: AnswerKind
  /** The provider's or the author's latest message, which the answer is to. */
  replyReceivedAt: Temporal.Instant
  replyText: string
  /** `null` signs the answer by the newsroom alone (`13d`). */
  signatureName: string | null
  /** The consent request's subject; the Mailer sends the thread's own with `Re:`. */
  subject: string
  text: string
  to: string
  /** The Gmail message of the provider the answer goes to (`replyMessageId`). */
  replyToMessageId: string
}

/**
 * Paragraphs as the editor typed them: a blank line starts a new one, a single break is a new
 * line in it. The words are the editor's, so nothing is tied or linked; the client links an
 * address on its own.
 */
function paragraphs(text: string, style: string): string {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .map((part) => `<p style="${style}">${escapeHtml(part).replaceAll('\n', '<br>')}</p>`)
    .join('')
}

/**
 * The answer from _Ke kontrole_ (`13h`): the editor's text, the signature, the house footer of the
 * consent request, and the provider's latest message quoted under it, as a reply in a mail client
 * is laid out. It adds no greeting and no _Děkujeme_: the editor writes the whole text.
 */
export function answerEmail(details: AnswerDetails): MailMessage {
  let reason = details.kind === 'articles' ? ARTICLE_REASON_LINE : CONSENT_REASON_LINE
  let signature = [
    details.signatureName === null
      ? ''
      : `<p style="margin:24px 0 0;font-size:15px;line-height:1.6">${escapeHtml(details.signatureName)}</p>`,
    `<p style="margin:${details.signatureName === null ? '24px' : '0'} 0 24px;font-size:15px;line-height:1.6;font-weight:600">${SIGNATURE_NEWSROOM}</p>`,
  ].join('')
  let body = [
    paragraphs(details.text, PARAGRAPH_STYLE),
    signature,
    `<p style="${SMALL_STYLE}">${escapeHtml(keepOneLetterWords(CONSENT_QUESTION_LINE))}</p>`,
    `<p style="${SMALL_STYLE}">${escapeHtml(ASSOCIATION_NAME)} IČO: ${ASSOCIATION_ID}</p>`,
    `<p style="${SMALL_STYLE}">${escapeHtml(keepOneLetterWords(reason))}</p>`,
    `<p style="margin:24px 0 8px;font-size:13px;line-height:1.6">${escapeHtml(quoteIntro(details.replyReceivedAt))}</p>`,
    `<blockquote style="${QUOTE_STYLE}">${paragraphs(details.replyText, 'margin:0 0 12px')}</blockquote>`,
  ].join('')

  return {
    htmlBody: htmlDocument(details.subject, body),
    idempotencyKey: details.idempotencyKey,
    name: SENDER_NAME,
    replyToMessageId: details.replyToMessageId,
    subject: details.subject,
    to: details.to,
  }
}
