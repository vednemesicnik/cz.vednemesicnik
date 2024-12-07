import { createCookie, createCookieSessionStorage, redirect, type Session } from "react-router";

import { prisma } from "~/utils/db.server"

const SESSION_AUTH_ID_KEY = "sessionAuthId"

type SessionAuthCookieData = {
  [SESSION_AUTH_ID_KEY]: string
}

type SessionAuthCookieFlashData = {
  error: string
}

type SessionAuthCookieSession = Session<
  SessionAuthCookieData,
  SessionAuthCookieFlashData
>

const cookieSessionStorage = createCookieSessionStorage<
  SessionAuthCookieData,
  SessionAuthCookieFlashData
>({
  cookie: createCookie("vdm_session_auth", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    secrets: process.env.SESSION_SECRET?.split(","),
  }),
})

export const getSessionAuthCookieSession = async (request: Request) =>
  cookieSessionStorage.getSession(request.headers.get("Cookie"))

export const setSessionAuthCookieSession = async (
  request: Request,
  sessionAuthId: string,
  expirationDate: Date
) => {
  const cookieSession = await getSessionAuthCookieSession(request)
  cookieSession.set(SESSION_AUTH_ID_KEY, sessionAuthId)

  return cookieSessionStorage.commitSession(cookieSession, {
    expires: expirationDate,
  })
}

export const deleteSessionAuthCookieSession = async (
  cookieSession: SessionAuthCookieSession
) => cookieSessionStorage.destroySession(cookieSession)

export const getSessionAuthId = (cookieSession: SessionAuthCookieSession) =>
  cookieSession.get(SESSION_AUTH_ID_KEY)

const getSessionFromDatabase = async (sessionAuthId: string) => {
  return prisma.session.findUnique({
    where: {
      id: sessionAuthId,
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

  const cookieSession = await getSessionAuthCookieSession(request)
  const sessionAuthId = getSessionAuthId(cookieSession)

  if (sessionAuthId !== undefined) {
    session = await getSessionFromDatabase(sessionAuthId)
  }

  if (session === null) {
    throw redirect("/administration/sign-in", {
      headers: {
        "Set-Cookie": await deleteSessionAuthCookieSession(cookieSession),
      },
    })
  }

  return {
    isAuthenticated: true,
    sessionId: session.id,
  }
}

export const getAuthentication = async (request: Request) => {
  const cookieSession = await getSessionAuthCookieSession(request)
  const sessionAuthId = getSessionAuthId(cookieSession)

  if (sessionAuthId !== undefined) {
    const session = await getSessionFromDatabase(sessionAuthId)

    return { isAuthenticated: session !== null, sessionId: session?.id }
  }

  return { isAuthenticated: false, sessionId: undefined }
}

export const requireUnauthenticated = async (request: Request) => {
  let session: { id: string } | null = null

  const authSession = await getSessionAuthCookieSession(request)
  const sessionId = getSessionAuthId(authSession)

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

const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 // 1 day (in milliseconds)

export const getSessionAuthCookieSessionExpirationDate = () =>
  new Date(Date.now() + SESSION_EXPIRATION_TIME)
