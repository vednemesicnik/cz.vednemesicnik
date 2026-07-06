import {
  createCookie,
  createCookieSessionStorage,
  redirect,
  type Session,
} from 'react-router'

import { prisma } from '~/utils/db.server'

const SESSION_AUTH_ID_KEY = 'sessionAuthId'

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
  cookie: createCookie('vdm_session_auth', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: process.env.SESSION_SECRET?.split(','),
    secure: process.env.NODE_ENV === 'production',
  }),
})

export const getSessionAuthCookieSession = async (request: Request) =>
  cookieSessionStorage.getSession(request.headers.get('Cookie'))

export const setSessionAuthCookieSession = async (
  request: Request,
  sessionAuthId: string,
  expirationDate: Date,
) => {
  const cookieSession = await getSessionAuthCookieSession(request)
  cookieSession.set(SESSION_AUTH_ID_KEY, sessionAuthId)

  return cookieSessionStorage.commitSession(cookieSession, {
    expires: expirationDate,
  })
}

export const deleteSessionAuthCookieSession = async (
  cookieSession: SessionAuthCookieSession,
) => cookieSessionStorage.destroySession(cookieSession)

export const getSessionAuthId = (cookieSession: SessionAuthCookieSession) =>
  cookieSession.get(SESSION_AUTH_ID_KEY)

const getSessionFromDatabase = async (sessionAuthId: string) => {
  return prisma.session.findUnique({
    select: {
      id: true,
    },
    where: {
      expirationDate: {
        gt: new Date(),
      },
      id: sessionAuthId,
    },
  })
}

const SIGN_IN_PATH = '/administration/sign-in'

// Loads the current valid session (or null) alongside its cookie session, so the
// callers below can both read the result and clear the cookie on failure.
const loadSession = async (request: Request) => {
  const cookieSession = await getSessionAuthCookieSession(request)
  const sessionAuthId = getSessionAuthId(cookieSession)

  const session =
    sessionAuthId !== undefined
      ? await getSessionFromDatabase(sessionAuthId)
      : null

  return { cookieSession, session }
}

// Bounces to sign-in and clears the (stale) auth cookie. `redirectTo` is an
// optional return path; `safeRedirect` re-validates it on the way out (see
// signInUser), so it is only a hint.
const redirectToSignIn = async (
  cookieSession: SessionAuthCookieSession,
  redirectTo?: string,
) => {
  const location =
    redirectTo === undefined
      ? SIGN_IN_PATH
      : `${SIGN_IN_PATH}?${new URLSearchParams({ redirectTo })}`

  return redirect(location, {
    headers: {
      'Set-Cookie': await deleteSessionAuthCookieSession(cookieSession),
    },
  })
}

/**
 * Route-level auth guard for loaders/actions. On failure it bounces to sign-in
 * and preserves where the user was headed via `redirectTo`, so pass React
 * Router's normalized `url` arg. Bare-`Request` callers behind the authenticated
 * layout (e.g. permission-context helpers) want `requireSession` instead.
 */
export const requireAuthentication = async ({
  request,
  url,
}: {
  request: Request
  url: URL
}) => {
  const { cookieSession, session } = await loadSession(request)

  if (session === null) {
    throw await redirectToSignIn(cookieSession, url.pathname + url.search)
  }

  return {
    isAuthenticated: true,
    sessionId: session.id,
  }
}

/**
 * Minimal auth guard for callers that only hold a bare `Request` (no route
 * `url`) and don't need a return path — e.g. the permission-context helpers,
 * which run behind the authenticated layout guard, and actions where a
 * `redirectTo` back to a POST endpoint would be meaningless. On failure it
 * bounces to sign-in without a `redirectTo`.
 */
export const requireSession = async (request: Request) => {
  const { cookieSession, session } = await loadSession(request)

  if (session === null) {
    throw await redirectToSignIn(cookieSession)
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
    throw redirect('/administration')
  }

  return {
    isAuthenticated: false,
    sessionId: undefined,
  }
}

const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 // 1 day (in milliseconds)

export const getSessionAuthCookieSessionExpirationDate = () =>
  new Date(Date.now() + SESSION_EXPIRATION_TIME)
