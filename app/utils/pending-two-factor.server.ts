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

type PendingTwoFactorCookieData = {
  [PENDING_TWO_FACTOR_KEY]: string
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
    path: '/',
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
) => {
  const cookieSession = await getPendingTwoFactorCookieSession(request)

  cookieSession.set(PENDING_TWO_FACTOR_KEY, userId)

  return cookieSessionStorage.commitSession(cookieSession)
}

export const deletePendingTwoFactorCookieSession = async (
  cookieSession: PendingTwoFactorCookieSession,
) => cookieSessionStorage.destroySession(cookieSession)

export const getPendingTwoFactorUserId = (
  cookieSession: PendingTwoFactorCookieSession,
) => cookieSession.get(PENDING_TWO_FACTOR_KEY)
