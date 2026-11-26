import { createHash } from 'node:crypto'

import type { Digest, DigestCandidate } from '../domain/proofreading-digest.ts'
import { keepOneLetterWords } from '../domain/public/typography.ts'
import { formatDate, formatDayMonth } from '../domain/time.ts'
import {
  escapeHtml,
  houseEnding,
  htmlDocument,
  PARAGRAPH_STYLE,
  SENDER_NAME,
} from './association.server.ts'
import type { MailMessage } from './mailer.server.ts'
import { WELCOME_QUESTION_LINE } from './welcome-email.server.ts'

/**
 * The proofreaders' morning digest (`12n`): one e-mail to their address, in three parts, each
 * left out while empty — _Nově předané_, _Zrušená předání_, _Stále čekají na korekturu_. Every
 * article stands as in `20e`: its name in bold, its issue and date, its authors, and a button to
 * its card on the page _Korektura_, where taking it is recorded. A cancelled one has neither
 * authors nor button: there is nothing on it to do now. Who handed it over is left out, because
 * an editor-in-chief always does.
 *
 * Like every e-mail of the app, the HTML is written by hand with inline styles and sets no text
 * or background colour but the primary button's. Its own sentences keep a one-letter word with
 * the next; the names of articles, issues and authors go in as typed.
 */

export type DigestDetails = {
  digest: Digest
  /** When the last confirmed digest started, for the idempotency key; `null` before the first. */
  lastSentAt: Temporal.Instant | null
  /** `APP_ORIGIN`, which the links lead to. */
  origin: string
  to: string
  today: Temporal.Instant
}

/** The same every morning but for the date, so the group can filter it (`12n`, `satqkmyq`). */
export function digestSubject(today: Temporal.Instant): string {
  return `Ke korektuře – ${formatDate(today)}`
}

export const DIGEST_GREETING = 'Dobrý den,'
export const DIGEST_LEAD = 'posíláme přehled článků ke korektuře.'
export const NEW_PART_TITLE = 'Nově předané'
export const CANCELLED_PART_TITLE = 'Zrušená předání'
export const CANCELLED_PART_TEXT = 'U těchto článků šéfredakce zrušila předání.'
export const WAITING_PART_TITLE = 'Stále čekají na korekturu'
export const OPEN_IN_APP_LABEL = 'Otevřít v Publikaci'
/** The one step expected of a proofreader, with the page it happens on (`12n`, `tlb36tk0`). */
export const DIGEST_STEP_BEFORE = 'Než začnete opravovat, otevřete v Publikaci stránku'
export const DIGEST_STEP_PAGE = 'Korektura'
export const DIGEST_STEP_AFTER = 'a u článku zvolte Vzít si korekturu.'
export const DIGEST_REASON_LINE =
  'Přehled posíláme, když přibude nové předání nebo když šéfredakce zruší předání oznámené v některém z předchozích přehledů.'

/**
 * The page _Korektura_ with the article's card (`15a`). The article goes as a query, not as an
 * anchor: an anchor would be lost on the way through Google's sign-in, a query survives in
 * `redirectTo` (`sh0zp1if`).
 */
export function articleCardUrl(origin: string, articleId: number): string {
  return `${origin}/proofreading?article=${articleId}`
}

/**
 * The Mailer's idempotency key: the same parts with the same articles at the same times, to the
 * same address and after the same confirmed digest, give the same key, so a run retried after a
 * timeout that did send mails nobody twice. A digest whose content changed is a new one, and so is
 * one after another confirmed send: an article cancelled and then restored with its old time
 * reads as before, and the Mailer, which remembers a key for six hours, would send it nowhere.
 */
export function digestIdempotencyKey(
  digest: Digest,
  to: string,
  lastSentAt: Temporal.Instant | null,
): string {
  let lines = [
    `to:${to}`,
    `after:${lastSentAt?.toString() ?? 'none'}`,
    ...digest.handedOver.map((each) => `new:${each.id}:${each.handedOverAt.toString()}`),
    ...digest.cancelled.map((each) => `cancelled:${each.id}:${each.cancelledAt?.toString()}`),
    ...digest.waiting.map((each) => `waiting:${each.id}:${each.handedOverAt.toString()}`),
  ].sort()
  let hash = createHash('sha256').update(lines.join('\n')).digest('hex')
  return `proofreading-digest:${hash}`
}

const PART_TITLE = 'margin:24px 0 8px;font-size:18px;line-height:1.4;font-weight:700'
const ITEM = 'border-top:1px solid #cad5e2;padding:12px 0 0;margin:12px 0 0'
const ITEM_TITLE = 'margin:0 0 4px;font-size:16px;line-height:1.5;font-weight:700'
const ITEM_LINE = 'margin:0 0 4px;font-size:14px;line-height:1.6'
const PRIMARY =
  'display:inline-block;margin:8px 0 0;padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;background:#7c3aed;color:#ffffff'

function articleBlock(article: DigestCandidate, origin: string, isCancelled: boolean): string {
  let name = escapeHtml(article.name)
  let when =
    isCancelled && article.cancelledAt !== null
      ? `předání zrušeno ${formatDayMonth(article.cancelledAt)}`
      : `předáno ${formatDayMonth(article.handedOverAt)}`
  let lines = [
    `<p style="${ITEM_TITLE}">${name}</p>`,
    `<p style="${ITEM_LINE}">Vydání ${escapeHtml(article.issueName)} · ${keepOneLetterWords(when)}</p>`,
  ]
  if (!isCancelled) {
    lines.push(
      `<p style="${ITEM_LINE}">Autoři: ${escapeHtml(article.authors.join(', '))}</p>`,
      `<a href="${escapeHtml(articleCardUrl(origin, article.id))}" style="${PRIMARY}" aria-label="${escapeHtml(`${OPEN_IN_APP_LABEL} „${article.name}“`)}">${OPEN_IN_APP_LABEL}</a>`,
    )
  }
  return `<div style="${ITEM}">${lines.join('')}</div>`
}

function part(
  title: string,
  articles: readonly DigestCandidate[],
  origin: string,
  options: { isCancelled?: boolean; text?: string } = {},
): string {
  if (articles.length === 0) return ''
  return [
    `<h2 style="${PART_TITLE}">${escapeHtml(title)}</h2>`,
    options.text === undefined
      ? ''
      : `<p style="${ITEM_LINE}">${escapeHtml(keepOneLetterWords(options.text))}</p>`,
    ...articles.map((article) => articleBlock(article, origin, options.isCancelled === true)),
  ].join('')
}

export function digestEmail(details: DigestDetails): MailMessage {
  let { digest, origin } = details
  let subject = digestSubject(details.today)
  let step = `${escapeHtml(keepOneLetterWords(DIGEST_STEP_BEFORE))} <a href="${escapeHtml(`${origin}/proofreading`)}">${DIGEST_STEP_PAGE}</a> ${escapeHtml(keepOneLetterWords(DIGEST_STEP_AFTER))}`

  let body = [
    `<p style="${PARAGRAPH_STYLE}">${DIGEST_GREETING}</p>`,
    `<p style="${PARAGRAPH_STYLE}">${escapeHtml(keepOneLetterWords(DIGEST_LEAD))}</p>`,
    part(NEW_PART_TITLE, digest.handedOver, origin),
    part(CANCELLED_PART_TITLE, digest.cancelled, origin, {
      isCancelled: true,
      text: CANCELLED_PART_TEXT,
    }),
    part(WAITING_PART_TITLE, digest.waiting, origin),
    `<p style="margin:24px 0 16px;font-size:15px;line-height:1.6">${step}</p>`,
    houseEnding({
      question: WELCOME_QUESTION_LINE,
      reason: DIGEST_REASON_LINE,
      signOff: 'S pozdravem',
    }),
  ].join('')

  return {
    htmlBody: htmlDocument(subject, body),
    idempotencyKey: digestIdempotencyKey(digest, details.to, details.lastSentAt),
    name: SENDER_NAME,
    subject,
    to: details.to,
  }
}
