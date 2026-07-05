import {
  createCookie,
  createCookieSessionStorage,
  type Session,
} from 'react-router'

import type { TwoFactorConfig } from '~/utils/two-factor.server'

// Holds the not-yet-confirmed TOTP config between the enrollment loader (which
// generates the secret + QR) and the action (which verifies the first code and
// persists it). Short-lived and httpOnly, modelled on biometric.server.ts. The
// config is bound to the user it was generated for so a pending secret is never
// reused across accounts sharing a browser.
const PENDING_ENROLLMENT_KEY = 'pendingTwoFactorEnrollment'

type PendingEnrollment = {
  userId: string
  config: TwoFactorConfig
}

type EnrollmentCookieData = {
  [PENDING_ENROLLMENT_KEY]: PendingEnrollment
}

type EnrollmentCookieFlashData = {
  error: string
}

type EnrollmentCookieSession = Session<
  EnrollmentCookieData,
  EnrollmentCookieFlashData
>

const cookieSessionStorage = createCookieSessionStorage<
  EnrollmentCookieData,
  EnrollmentCookieFlashData
>({
  cookie: createCookie('vdm_2fa_enrollment', {
    httpOnly: true,
    maxAge: 600, // 10 minutes (in seconds)
    // Scope covers both the route path and its React Router `.data` request
    // variant (Single Fetch). A tighter `/…/two-factor` path would fail cookie
    // path-matching for `/…/two-factor.data`, so the cookie would never be sent.
    path: '/administration/settings/profile',
    sameSite: 'lax',
    secrets: process.env.SESSION_SECRET?.split(','),
    secure: process.env.NODE_ENV === 'production',
  }),
})

export const getEnrollmentCookieSession = async (request: Request) =>
  cookieSessionStorage.getSession(request.headers.get('Cookie'))

export const setEnrollmentCookieSession = async (
  request: Request,
  userId: string,
  config: TwoFactorConfig,
) => {
  const cookieSession = await getEnrollmentCookieSession(request)

  cookieSession.set(PENDING_ENROLLMENT_KEY, { config, userId })

  return cookieSessionStorage.commitSession(cookieSession)
}

export const deleteEnrollmentCookieSession = async (
  cookieSession: EnrollmentCookieSession,
) => cookieSessionStorage.destroySession(cookieSession)

// Returns the pending config only when it was generated for the given user.
export const getPendingEnrollment = (
  cookieSession: EnrollmentCookieSession,
  userId: string,
): TwoFactorConfig | undefined => {
  const pending = cookieSession.get(PENDING_ENROLLMENT_KEY)

  if (pending === undefined || pending.userId !== userId) {
    return undefined
  }

  return pending.config
}
