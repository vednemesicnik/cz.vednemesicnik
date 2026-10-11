import {
  createCookie,
  createCookieSessionStorage,
  type Session,
} from 'react-router'

// After a correct break-glass password, we do NOT create a session yet: we stash
// the user id in this short-lived cookie and redirect to the TOTP entry step,
// creating the real session only once the second factor is verified. Modelled on
// biometric.server.ts.
const PENDING_TWO_FACTOR_KEY = 'pendingTwoFactorUserId'
const ATTEMPTS_KEY = 'attempts'
// Where to land once the second factor succeeds (see
// get-pending-two-factor-redirect-to.server.ts).
export const REDIRECT_TO_KEY = 'redirectTo'

// Cap on wrong TOTP guesses per pending sign-in before the cookie is invalidated
// and the user must re-enter the password. Bounds brute-forcing the 6-digit code
// within the cookie lifetime without relying on an external rate limiter.
export const MAX_TWO_FACTOR_ATTEMPTS = 5

type PendingTwoFactorCookieData = {
  [PENDING_TWO_FACTOR_KEY]: string
  [ATTEMPTS_KEY]: number
  [REDIRECT_TO_KEY]: string
}

type PendingTwoFactorCookieFlashData = {
  error: string
}

export type PendingTwoFactorCookieSession = Session<
  PendingTwoFactorCookieData,
  PendingTwoFactorCookieFlashData
>

const cookieSessionStorage = createCookieSessionStorage<
  PendingTwoFactorCookieData,
  PendingTwoFactorCookieFlashData
>({
  cookie: createCookie('vdm_pending_2fa', {
    httpOnly: true,
    maxAge: 300, // 5 minutes (in seconds)
    // Scope to the sign-in flow only, so this cookie is never sent to public
    // pages. Uses the parent `/administration/sign-in` (not the exact
    // verify-2fa route) so it still matches the React Router `.data` request
    // `/administration/sign-in/verify-2fa.data` under Single Fetch.
    path: '/administration/sign-in',
    sameSite: 'lax',
    secrets: process.env.SESSION_SECRET?.split(','),
    secure: process.env.NODE_ENV === 'production',
  }),
})

export const getPendingTwoFactorCookieSession = async (request: Request) =>
  cookieSessionStorage.getSession(request.headers.get('Cookie'))

type PendingTwoFactor = {
  attempts?: number
  redirectTo: string
  userId: string
}

/**
 * Stores a pending sign-in in the cookie and returns its `Set-Cookie` value.
 *
 * @param request - The request carrying the current pending cookie, if any.
 * @param pendingTwoFactor - The user awaiting the second factor, the failed
 *   attempts so far (default 0) and where to land once it succeeds.
 *   `redirectTo` is required so a stale cookie never carries an earlier
 *   sign-in's target.
 * @returns The serialized cookie.
 */
export const setPendingTwoFactorCookieSession = async (
  request: Request,
  { attempts = 0, redirectTo, userId }: PendingTwoFactor,
) => {
  const cookieSession = await getPendingTwoFactorCookieSession(request)

  cookieSession.set(PENDING_TWO_FACTOR_KEY, userId)
  cookieSession.set(ATTEMPTS_KEY, attempts)
  cookieSession.set(REDIRECT_TO_KEY, redirectTo)

  return cookieSessionStorage.commitSession(cookieSession)
}

export const deletePendingTwoFactorCookieSession = async (
  cookieSession: PendingTwoFactorCookieSession,
) => cookieSessionStorage.destroySession(cookieSession)

export const getPendingTwoFactorUserId = (
  cookieSession: PendingTwoFactorCookieSession,
) => cookieSession.get(PENDING_TWO_FACTOR_KEY)

export const getPendingTwoFactorAttempts = (
  cookieSession: PendingTwoFactorCookieSession,
) => cookieSession.get(ATTEMPTS_KEY) ?? 0
