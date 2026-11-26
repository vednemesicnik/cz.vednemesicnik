import {
  type PendingTwoFactorCookieSession,
  REDIRECT_TO_KEY,
} from '~/utils/pending-two-factor.server'
import { safeRedirect } from '~/utils/safe-redirect'

/**
 * Reads where a pending password sign-in lands once the second factor succeeds.
 *
 * @param cookieSession - The pending two-factor cookie session.
 * @returns The stored target run through `safeRedirect`, so `/administration`
 *   when the cookie holds none or holds one outside this app.
 */
export const getPendingTwoFactorRedirectTo = (
  cookieSession: PendingTwoFactorCookieSession,
) => safeRedirect(cookieSession.get(REDIRECT_TO_KEY))
