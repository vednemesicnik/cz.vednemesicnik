import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

import {
  ACTIVITY_ACTIONS,
  type ActivityAction,
} from '~/config/editorial-board-activity-config'

/** What a link from the re-confirmation e-mails says, once checked. */
export type ActivityTokenVerification =
  | { action: ActivityAction; email: string; expiresAt: Date; status: 'valid' }
  | { action: ActivityAction; expiresAt: Date; status: 'expired' }
  | { status: 'invalid' }

// The script's tokens are around 150 characters; this only stops an absurd input early.
const MAX_TOKEN_LENGTH = 1024
const ENCODED_PATTERN = /^[A-Za-z0-9_-]+={0,2}$/
const SIGNATURE_PATTERN = /^[0-9a-f]{64}$/

const payloadSchema = z.strictObject({
  action: z.enum(ACTIVITY_ACTIONS),
  email: z.string().min(1).max(254),
  exp: z.number().int().positive(),
})

const parsePayload = (encoded: string) => {
  try {
    const json: unknown = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    )
    const parsed = payloadSchema.safeParse(json)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/**
 * Checks a token from a link in the re-confirmation e-mails. The Apps Script signs it
 * (SCRIPT__Editorial_Board__Membership, `build-activity-token.gs`), so this is the one
 * place the app trusts a signature it did not make: `<base64url JSON { email, action, exp
 * }>.<lower-case hex HMAC-SHA256 of that base64url string>`, with LINK_SECRET.
 *
 * The signature is compared in constant time before anything in the payload is read, so a
 * forged `exp` or action never gets that far. Only then is the expiry checked, so an expired
 * link still says which choice it carried and until when.
 *
 * @param token - The `token` parameter of the link, as it arrived.
 * @param secret - `GAS_EDITORIAL_BOARD_LINK_SECRET`; an empty one makes every link
 *   invalid.
 * @param now - The current time in milliseconds.
 * @returns `valid` with the action and the address; `expired` with the action and when
 *   the link stopped working; `invalid` for anything else, which says nothing about why.
 */
export const verifyActivityToken = (
  token: string,
  secret: string,
  now: number,
): ActivityTokenVerification => {
  const invalid = { status: 'invalid' } as const

  if (secret === '' || token.length > MAX_TOKEN_LENGTH) return invalid

  const separator = token.lastIndexOf('.')
  const encoded = token.slice(0, separator)
  const signature = token.slice(separator + 1)

  if (
    separator === -1 ||
    !ENCODED_PATTERN.test(encoded) ||
    !SIGNATURE_PATTERN.test(signature)
  ) {
    return invalid
  }

  const expected = createHmac('sha256', secret).update(encoded).digest()

  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return invalid

  const payload = parsePayload(encoded)

  if (payload === null) return invalid

  const expiresAt = new Date(payload.exp * 1000)

  if (now >= expiresAt.getTime()) {
    return { action: payload.action, expiresAt, status: 'expired' }
  }

  return {
    action: payload.action,
    email: payload.email,
    expiresAt,
    status: 'valid',
  }
}
