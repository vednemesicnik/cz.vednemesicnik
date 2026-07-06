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

// Cap on wrong TOTP guesses per pending sign-in before the cookie is invalidated
// and the user must re-enter the password. Bounds brute-forcing the 6-digit code
// within the cookie lifetime without relying on an external rate limiter.
export const MAX_TWO_FACTOR_ATTEMPTS = 5

type PendingTwoFactorCookieData = {
  [PENDING_TWO_FACTOR_KEY]: string
  [ATTEMPTS_KEY]: number
}

type PendingTwoFactorCookieFlashData = {
  error: string
}

type PendingTwoFactorCookieSession = Session<
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

export const setPendingTwoFactorCookieSession = async (
  request: Request,
  userId: string,
  attempts = 0,
) => {
  const cookieSession = await getPendingTwoFactorCookieSession(request)

  cookieSession.set(PENDING_TWO_FACTOR_KEY, userId)
  cookieSession.set(ATTEMPTS_KEY, attempts)

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
