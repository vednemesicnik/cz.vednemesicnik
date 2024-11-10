import {
  createCookie,
  createCookieSessionStorage,
  redirect,
  type Session,
} from "@remix-run/node"

import { prisma } from "~/utils/db.server"

const SESSION_ID_KEY = "sessionId"
// 1 hour
const SESSION_EXPIRATION_TIME = 1000 * 60 * 60

type AuthSessionData = {
  [SESSION_ID_KEY]: string
}

type AuthSessionFlashData = {
  error: string
}

type AuthSession = Session<AuthSessionData, AuthSessionFlashData>

export const authStorage = createCookieSessionStorage<
  AuthSessionData,
  AuthSessionFlashData
>({
  cookie: createCookie("vdm_auth", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    secrets: process.env.SESSION_SECRET?.split(","),
  }),
})

export const getAuthSession = async (request: Request) =>
  authStorage.getSession(request.headers.get("Cookie"))

export const setAuthSession = async (
  session: AuthSession,
  expirationDate: Date
) => authStorage.commitSession(session, { expires: expirationDate })

export const createAuthSession = async (
  request: Request,
  sessionId: string,
  expirationDate: Date
) => {
  const authSession = await getAuthSession(request)

  authSession.set(SESSION_ID_KEY, sessionId)

  return setAuthSession(authSession, expirationDate)
}

export const deleteAuthSession = async (session: AuthSession) =>
  authStorage.destroySession(session)

export const getSessionId = (session: AuthSession) =>
  session.get(SESSION_ID_KEY)

const getSessionFromDatabase = async (sessionId: string) => {
  return prisma.session.findUnique({
    where: {
      id: sessionId,
      expirationDate: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
    },
  })
}

export const requireAuthentication = async (request: Request) => {
  let session: { id: string } | null = null

  const authSession = await getAuthSession(request)
  const sessionId = getSessionId(authSession)

  if (sessionId !== undefined) {
    session = await getSessionFromDatabase(sessionId)
  }

  if (session === null) {
    throw redirect("/administration/sign-in", {
      headers: {
        "Set-Cookie": await deleteAuthSession(authSession),
      },
    })
  }

  return {
    isAuthenticated: true,
    sessionId: session.id,
  }
}

export const getAuthentication = async (request: Request) => {
  const authSession = await getAuthSession(request)
  const sessionId = getSessionId(authSession)

  if (sessionId !== undefined) {
    const session = await getSessionFromDatabase(sessionId)

    return { isAuthenticated: session !== null, sessionId: session?.id }
  }

  return { isAuthenticated: false, sessionId: undefined }
}

export const requireUnauthenticated = async (request: Request) => {
  let session: { id: string } | null = null

  const authSession = await getAuthSession(request)
  const sessionId = getSessionId(authSession)

  if (sessionId !== undefined) {
    session = await getSessionFromDatabase(sessionId)
  }

  if (session !== null) {
    throw redirect("/administration")
  }

  return {
    isAuthenticated: false,
    sessionId: undefined,
  }
}

export const getSessionExpirationDate = () =>
  new Date(Date.now() + SESSION_EXPIRATION_TIME)
