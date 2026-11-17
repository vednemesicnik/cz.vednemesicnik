import { timingSafeEqual } from 'node:crypto'

import {
  VERIFICATION_CODE_LIFETIME_MILLISECONDS,
  type VerificationPurpose,
} from '~/config/email-verification-config'

import { createVerificationCode } from './create-verification-code.server'
import { normalizeVerificationCode } from './normalize-verification-code'

export type VerificationCodeCheck = 'expired' | 'valid' | 'wrong'

type CheckVerificationCodeOptions = {
  code: string
  email: string
  issuedAt: number
  now: number
  purpose: VerificationPurpose
  secret: string
}

/**
 * Checks a typed code against the one sent to `email` at `issuedAt`, compared
 * in constant time. A code from an earlier e-mail was made for another moment,
 * and a code from another form for another purpose, so they are `wrong`, as is
 * every code when the secret is not set.
 *
 * @param options - The typed code, the address and moment from the cookie, the
 *   current time, what the code confirms and the form's own secret.
 * @returns `expired` once the code's lifetime is over, whatever was typed;
 *   otherwise `valid` or `wrong`.
 */
export const checkVerificationCode = ({
  code,
  email,
  issuedAt,
  now,
  purpose,
  secret,
}: CheckVerificationCodeOptions): VerificationCodeCheck => {
  if (now >= issuedAt + VERIFICATION_CODE_LIFETIME_MILLISECONDS) {
    return 'expired'
  }
  if (secret === '') return 'wrong'

  const expected = Buffer.from(
    createVerificationCode({ email, issuedAt, purpose, secret }),
  )
  const typed = Buffer.from(normalizeVerificationCode(code))

  return expected.length === typed.length && timingSafeEqual(expected, typed)
    ? 'valid'
    : 'wrong'
}
