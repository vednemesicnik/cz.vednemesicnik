import {
  EMAIL_KEY,
  type PendingTwoFactorCookieSession,
} from '~/utils/pending-two-factor.server'

/**
 * Reads the e-mail a pending password sign-in was entered with.
 *
 * @param cookieSession - The pending two-factor cookie session.
 * @returns The e-mail, or `null` when the cookie holds none.
 */
export const getPendingTwoFactorEmail = (
  cookieSession: PendingTwoFactorCookieSession,
) => cookieSession.get(EMAIL_KEY) ?? null
