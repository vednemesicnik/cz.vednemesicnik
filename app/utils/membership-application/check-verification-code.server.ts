import { timingSafeEqual } from 'node:crypto'

import { VERIFICATION_CODE_LIFETIME_MILLISECONDS } from '~/config/membership-application-config'

import { createVerificationCode } from './create-verification-code.server'
import { normalizeVerificationCode } from './normalize-verification-code'

export type VerificationCodeCheck = 'expired' | 'valid' | 'wrong'

type CheckVerificationCodeOptions = {
  code: string
  email: string
  issuedAt: number
  now: number
  secret: string
}

/**
 * Checks a typed code against the one sent to `email` at `issuedAt`, compared
 * in constant time. A code from an earlier e-mail was made for another moment,
 * so it is `wrong`, as is every code when the secret is not set.
 *
 * @param options - The typed code, the address and moment from the cookie, the
 *   current time and `MEMBERSHIP_VERIFICATION_SECRET`.
 * @returns `expired` once the code's lifetime is over, whatever was typed;
 *   otherwise `valid` or `wrong`.
 */
export const checkVerificationCode = ({
  code,
  email,
  issuedAt,
  now,
  secret,
}: CheckVerificationCodeOptions): VerificationCodeCheck => {
  if (now >= issuedAt + VERIFICATION_CODE_LIFETIME_MILLISECONDS) {
    return 'expired'
  }
  if (secret === '') return 'wrong'

  const expected = Buffer.from(createVerificationCode(secret, email, issuedAt))
  const typed = Buffer.from(normalizeVerificationCode(code))

  return expected.length === typed.length && timingSafeEqual(expected, typed)
    ? 'valid'
    : 'wrong'
}
