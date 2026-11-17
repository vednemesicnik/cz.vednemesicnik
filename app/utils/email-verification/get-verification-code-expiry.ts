import { VERIFICATION_CODE_LIFETIME_MILLISECONDS } from '~/config/email-verification-config'

/**
 * When the code sent at `issuedAt` stops working. The page shows it and the
 * action keeps a live code by it, so both read it here.
 *
 * @param issuedAt - When the code was sent, in milliseconds; `undefined` when
 *   none was (a membership cookie from before #972).
 * @param now - The current time in milliseconds.
 * @returns The expiry while the code is live; `null` when no code was sent or
 *   it has expired.
 */
export const getVerificationCodeExpiry = (
  issuedAt: number | undefined,
  now: number,
): Date | null => {
  if (issuedAt === undefined) return null

  const expiresAt = issuedAt + VERIFICATION_CODE_LIFETIME_MILLISECONDS

  return now < expiresAt ? new Date(expiresAt) : null
}
