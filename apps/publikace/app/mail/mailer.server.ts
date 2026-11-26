import { createHmac } from 'node:crypto'

import type { MailSendEndpoint } from '../auth/environment.server.ts'

/**
 * The Mailer of the `publikace@` mailbox, `SCRIPT__Mail__Send`: one message per request, sent
 * natively as that account. The app reaches Gmail through it and never with a token of its own.
 *
 * The message travels in a signed envelope: `payload` is the message serialised once and signed
 * as that exact string, `signature` is HMAC-SHA256 of `${timestamp}.${payload}` under the secret,
 * which itself never leaves the app. The Mailer refuses a request older than five minutes.
 */

/** A file attached as the Mailer's schema takes it: at most 20, 25 MB decoded in all. */
export type MailAttachment = { data: string; filename: string; mimeType: string }

export type MailMessage = {
  attachments?: MailAttachment[]
  htmlBody: string
  /** The same on every attempt at one logical send: a repeat mails nobody (`Schema.gs`). */
  idempotencyKey: string
  /** The sender's display name. */
  name: string
  /**
   * The Gmail message this one answers, inside its thread: the provider's latest reply as the
   * reply check reports it (`13h`). `to` must then be that message's sender, nothing may be
   * copied, and Gmail sends the thread's own subject with `Re:`, so `subject` goes unused.
   */
  replyToMessageId?: string
  subject: string
  to: string
}

export type MailResult = { ok: true } | { error: string; ok: false }

export type Mailer = (message: MailMessage) => Promise<MailResult>

/*
 * The Mailer's answers that say the request itself is wrong, so the same request will be refused
 * again however often it is sent (`schema.gs`). Every other failure, a timeout or `server_error`
 * among them, may pass on a later try.
 */
const PERMANENT_REFUSALS = new Set([
  'attachment_too_large',
  'invalid_recipient',
  'invalid_request',
  'missing_fields',
  /* A reply the Mailer will not send into that thread: one outside the consent requests, a `to`
     that is not the message's sender, or a message Gmail does not find. */
  'reply_not_allowed',
  'too_many_recipients',
])

export function isPermanentRefusal(result: MailResult): boolean {
  return !result.ok && PERMANENT_REFUSALS.has(result.error)
}

export function signEnvelope(
  secret: string,
  payload: string,
  timestamp: number,
): { payload: string; signature: string; timestamp: number } {
  let signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
  return { payload, signature, timestamp }
}

/**
 * Sends through the Mailer. Never throws: the Mailer answers HTTP 200 whatever happened, so `ok`
 * is the only signal, and a timeout, a redirect loop or a body that is not JSON is a failure with
 * its reason logged.
 */
export function createMailer(
  endpoint: MailSendEndpoint,
  options: { fetch?: typeof fetch; now?: () => number; timeoutMs?: number } = {},
): Mailer {
  let send = options.fetch ?? fetch
  let seconds = options.now ?? (() => Math.floor(Date.now() / 1000))

  return async (message) => {
    let envelope = signEnvelope(endpoint.secret, JSON.stringify(message), seconds())
    try {
      let response = await send(endpoint.url, {
        body: JSON.stringify(envelope),
        // Apps Script reads the body whatever its type; text/plain needs no CORS preflight.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        method: 'POST',
        // A web app's /exec answers with a redirect to script.googleusercontent.com.
        redirect: 'follow',
        signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
      })
      if (!response.ok) return failed(`HTTP ${response.status}`)

      let answer = (await response.json()) as { error?: unknown; ok?: unknown }
      if (answer.ok === true) return { ok: true }
      return failed(typeof answer.error === 'string' ? answer.error : 'unknown')
    } catch (error) {
      return failed(error instanceof Error ? error.message : 'unknown error')
    }
  }
}

function failed(reason: string): MailResult {
  console.error(`[mail] a message was not sent: ${reason.slice(0, 200)}`)
  return { error: reason, ok: false }
}

/** The Mailer outside production when it is not configured: nothing is ever sent. */
export const mailerUnavailable: Mailer = async () => failed('MAIL_SEND_URL is not configured')
