import {
  createCookie,
  createCookieSessionStorage,
  type Session,
} from "@remix-run/node"

const BIOMETRIC_CHALLENGE_KEY = "biometricChallenge"

type BiometricCookieData = {
  [BIOMETRIC_CHALLENGE_KEY]: string
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
  cookie: createCookie("vdm_biometric", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    secrets: process.env.SESSION_SECRET?.split(","),
    maxAge: 60, // 1 minute (in seconds)
  }),
})

export const getBiometricCookieSession = async (request: Request) =>
  cookieSessionStorage.getSession(request.headers.get("Cookie"))

export const setBiometricCookieSession = async (
  request: Request,
  biometricChallenge: string
) => {
  const cookieSession = await getBiometricCookieSession(request)

  cookieSession.set(BIOMETRIC_CHALLENGE_KEY, biometricChallenge)

  return cookieSessionStorage.commitSession(cookieSession)
}

export const deleteBiometricCookieSession = async (
  cookieSession: BiometricCookieSession
) => cookieSessionStorage.destroySession(cookieSession)

export const getBiometricChallenge = (cookieSession: BiometricCookieSession) =>
  cookieSession.get(BIOMETRIC_CHALLENGE_KEY)
