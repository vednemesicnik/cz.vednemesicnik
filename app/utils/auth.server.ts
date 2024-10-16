import {
  createCookie,
  createCookieSessionStorage,
  type Session,
} from "@remix-run/node"

type AuthSessionData = {
  userId: string
}

type AuthSessionFlashData = {
  error: string
}

type AuthSession = Session<AuthSessionData, AuthSessionFlashData>

export const authStorage = createCookieSessionStorage<
  AuthSessionData,
  AuthSessionFlashData
>({
  cookie: createCookie("auth", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    secrets: process.env.SESSION_SECRET?.split(","),
    maxAge: 60 * 60 * 24, // 1 day
  }),
})

export const getAuthSession = async (request: Request) => {
  return await authStorage.getSession(request.headers.get("Cookie"))
}

export const setAuthSession = async (session: AuthSession) => {
  return await authStorage.commitSession(session)
}

export const createAuthSession = async (request: Request, userId: string) => {
  const authSession = await getAuthSession(request)

  authSession.set("userId", userId)

  return await setAuthSession(authSession)
}

export const deleteAuthSession = async (session: AuthSession) => {
  return await authStorage.destroySession(session)
}

export const getAuthorization = async (request: Request) => {
  const authSession = await getAuthSession(request)
  const userId = authSession.get("userId")

  if (userId !== undefined) {
    return { isAuthorized: true, userId }
  }

  return { isAuthorized: false }
}
