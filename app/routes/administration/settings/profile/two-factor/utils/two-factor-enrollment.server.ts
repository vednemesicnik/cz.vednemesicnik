import {
  createCookie,
  createCookieSessionStorage,
  type Session,
} from 'react-router'

import type { TwoFactorConfig } from '~/utils/two-factor.server'

// Holds the not-yet-confirmed TOTP config between the enrollment loader (which
// generates the secret + QR) and the action (which verifies the first code and
// persists it). Short-lived and httpOnly, modelled on biometric.server.ts.
const PENDING_ENROLLMENT_KEY = 'pendingTwoFactorEnrollment'

type EnrollmentCookieData = {
  [PENDING_ENROLLMENT_KEY]: TwoFactorConfig
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
  config: TwoFactorConfig,
) => {
  const cookieSession = await getEnrollmentCookieSession(request)

  cookieSession.set(PENDING_ENROLLMENT_KEY, config)

  return cookieSessionStorage.commitSession(cookieSession)
}

export const deleteEnrollmentCookieSession = async (
  cookieSession: EnrollmentCookieSession,
) => cookieSessionStorage.destroySession(cookieSession)

export const getPendingEnrollment = (cookieSession: EnrollmentCookieSession) =>
  cookieSession.get(PENDING_ENROLLMENT_KEY)
