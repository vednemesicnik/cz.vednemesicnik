import { VERIFICATION_CODE_LIFETIME_MILLISECONDS } from '~/config/membership-application-config'

import type { MembershipApplicationState } from './read-membership-application-cookie.server'

/**
 * When the code sent for the application stops working. The page shows it and
 * the action keeps a live code by it, so both read it here.
 *
 * @param application - The application in progress.
 * @param now - The current time in milliseconds.
 * @returns The expiry while the code is live; `null` when no code was sent
 *   (a cookie from before #972) or it has expired.
 */
export const getVerificationCodeExpiry = (
  application: Extract<MembershipApplicationState, { state: 'details' }>,
  now: number,
): Date | null => {
  if (application.verification === undefined) return null

  const expiresAt =
    application.verification.issuedAt + VERIFICATION_CODE_LIFETIME_MILLISECONDS

  return now < expiresAt ? new Date(expiresAt) : null
}
