import { redirect } from 'react-router'
import { setSessionAuthCookieSession } from '~/utils/auth.server'
import { type AuthMethod, recordAuthLog } from '~/utils/auth-log.server'
import { prisma } from '~/utils/db.server'
import { safeRedirect } from '~/utils/safe-redirect'
import { createSession } from '~/utils/session.server'

/**
 * Looks up an existing user by email.
 *
 * The account must already exist: unknown emails are rejected, accounts are
 * only created manually / via seed. There is no active/enabled state on the
 * User model, so this is purely an existence check. Shared by the passwordless
 * sign-in methods (magic link, OAuth).
 *
 * @returns the user, or `null` when no account matches the email
 */
export const findExistingUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    select: { email: true, id: true },
    where: { email },
  })
}

/**
 * Completes a sign-in for the given user: creates a session, sets the auth
 * cookie and redirects into the administration. Shared by the passwordless
 * sign-in methods (magic link, OAuth).
 *
 * `redirectTo` (optional) lets a flow return the user to the page they were
 * bounced from; it is always run through `safeRedirect`, so an untrusted value
 * (e.g. carried across the OAuth round-trip) can only point back into this app.
 *
 * `headers` (optional) are merged into the redirect response — used by OAuth to
 * also clear its transient `vdm_oauth` cookie in the same response.
 *
 * `method` identifies the sign-in method for the audit log; the successful
 * event is recorded here once for every caller.
 *
 * Always throws: a redirect on success, or a DB error from `createSession`
 * (which never returns normally on failure). Callers `await` it as the final
 * step; nothing after the call runs.
 */
export const signInUser = async (
  request: Request,
  userId: string,
  method: AuthMethod,
  redirectTo?: string,
  headers?: Headers,
) => {
  const session = await createSession(userId)

  recordAuthLog({ event: 'sign_in_success', method, request, userId })

  const responseHeaders = headers ?? new Headers()
  responseHeaders.append(
    'Set-Cookie',
    await setSessionAuthCookieSession(
      request,
      session.id,
      session.expirationDate,
    ),
  )

  throw redirect(safeRedirect(redirectTo), { headers: responseHeaders })
}
