import { createCookie } from 'remix/cookie'

import { sessionSecrets } from './environment.server.ts'

/**
 * How long a sign-in lasts: seven days from the moment it happened, whatever happens after
 * (`03`, rozhodnuto 17. 11. 2026). The store stamps `expires_at` from it and the cookies carry
 * the same span, so the browser and the row agree about when it is over. In hours, because an
 * instant is added to by exact time, never by calendar days.
 */
export const SESSION_LIFETIME = Temporal.Duration.from({ hours: 7 * 24 })

const SESSION_LIFETIME_SECONDS = SESSION_LIFETIME.total({ unit: 'seconds' })

/**
 * How long an answer about access is trusted before the next request asks again: ten minutes.
 * Somebody dropped from a group loses access within ten minutes, and the
 * membership service is not asked on every request.
 */
export const AUTHORIZATION_TTL_MS = 10 * 60 * 1000

/**
 * How long a sign-in that rested partly on an unanswered service waits before asking again: one
 * minute. The role the service could not confirm stays off meanwhile, so nothing is granted on a
 * guess. Asking on every request instead would make every page wait the service's whole timeout
 * through an outage, an editor-in-chief named in Přístup included, who is asked only whether they
 * proofread too.
 */
export const UNSETTLED_RETRY_MS = 60 * 1000

/** Session key holding the signed-in person. */
export const EDITOR_SESSION_KEY = 'editor'

/**
 * Session key holding the address that was refused with `notlisted`, for the sentence on the
 * sign-in page. In the session rather than in the URL, where it would end up in history and
 * logs; kept until the next successful sign-in, so a reload still shows it.
 */
export const REFUSED_EMAIL_SESSION_KEY = 'refusedEmail'

/** Session key holding when the sign-out happened, for `10b`. Read once. */
export const SIGNED_OUT_AT_SESSION_KEY = 'signedOutAt'

/** What the session holds for a signed-in person. */
export type StoredEditor = {
  /**
   * Epoch milliseconds until which the last answer about access is trusted: ten minutes, or one
   * when that answer rested on a service that did not reply.
   */
  authorizedUntil: number
  displayName: string
  email: string
  /**
   * The roles that answer gave (`10d`). A session that lacks them is decided again, as if its
   * answer were old.
   */
  isEditor?: boolean
  isProofreader?: boolean
}

/** What the session keeps of a decision that let somebody in. */
export function storedPerson(decision: {
  displayName: string
  email: string
  isSettled: boolean
  roles: { isEditor: boolean; isProofreader: boolean }
}): StoredEditor {
  return {
    authorizedUntil: Date.now() + (decision.isSettled ? AUTHORIZATION_TTL_MS : UNSETTLED_RETRY_MS),
    displayName: decision.displayName,
    email: decision.email,
    isEditor: decision.roles.isEditor,
    isProofreader: decision.roles.isProofreader,
  }
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * The session cookie: only the id travels, the contents are a row in the database.
 *
 * `Lax` rather than `Strict`, because the return from Google is a top-level navigation from
 * accounts.google.com, and a strict cookie would not come with it.
 */
export function createSessionCookie() {
  return createCookie('publikace_session', {
    httpOnly: true,
    maxAge: SESSION_LIFETIME_SECONDS,
    path: '/',
    sameSite: 'Lax',
    secrets: sessionSecrets(),
    secure: isProduction(),
  })
}

/**
 * When the sign-in in this browser ends, kept beside the session so that a browser whose
 * session is gone can tell why (`10a`, `expired`).
 *
 * It holds the expiry instant and nothing about the person. A request with no session whose
 * marker has passed is an expiry; a marker still in the future means the session was ended
 * early — the account removed, signed out elsewhere — and gets no message; no marker is a first
 * visit.
 *
 * It outlives the session by thirty days, because a marker gone together with the session could
 * tell nothing: the browser would forget it at the very moment it is needed.
 */
export function createSignedInUntilCookie() {
  return createCookie('publikace_signed_in_until', {
    httpOnly: true,
    maxAge: SESSION_LIFETIME_SECONDS + 30 * 24 * 60 * 60,
    path: '/',
    sameSite: 'Lax',
    secrets: sessionSecrets(),
    secure: isProduction(),
  })
}

export type SignedInUntilCookie = ReturnType<typeof createSignedInUntilCookie>
