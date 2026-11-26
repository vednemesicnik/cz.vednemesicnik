import {
  createCookie,
  createCookieSessionStorage,
  type Session,
} from 'react-router'

const BIOMETRIC_CHALLENGE_KEY = 'biometricChallenge'
const REDIRECT_TO_KEY = 'redirectTo'

type BiometricCookieData = {
  [BIOMETRIC_CHALLENGE_KEY]: string
  [REDIRECT_TO_KEY]: string
}

type BiometricCookieFlashData = {
  error: string
}

type BiometricCookieSession = Session<
  BiometricCookieData,
  BiometricCookieFlashData
>

const cookieSessionStorage = createCookieSessionStorage<
  BiometricCookieData,
  BiometricCookieFlashData
>({
  cookie: createCookie('vdm_biometric', {
    httpOnly: true,
    maxAge: 60, // 1 minute (in seconds)
    path: '/',
    sameSite: 'lax',
    secrets: process.env.SESSION_SECRET?.split(','),
    secure: process.env.NODE_ENV === 'production',
  }),
})

export const getBiometricCookieSession = async (request: Request) =>
  cookieSessionStorage.getSession(request.headers.get('Cookie'))

export const setBiometricCookieSession = async (
  request: Request,
  biometricChallenge: string,
  // Only the sign-in ceremony carries a return path; registration omits it.
  redirectTo = '',
) => {
  const cookieSession = await getBiometricCookieSession(request)

  cookieSession.set(BIOMETRIC_CHALLENGE_KEY, biometricChallenge)
  cookieSession.set(REDIRECT_TO_KEY, redirectTo)

  return cookieSessionStorage.commitSession(cookieSession)
}

export const deleteBiometricCookieSession = async (
  cookieSession: BiometricCookieSession,
) => cookieSessionStorage.destroySession(cookieSession)

export const getBiometricChallenge = (cookieSession: BiometricCookieSession) =>
  cookieSession.get(BIOMETRIC_CHALLENGE_KEY)

export const getBiometricRedirectTo = (cookieSession: BiometricCookieSession) =>
  cookieSession.get(REDIRECT_TO_KEY)
