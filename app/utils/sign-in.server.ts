import { redirect } from 'react-router'

import { createSession } from '~/routes/administration/sign-in/utils/create-session.server'
import { setSessionAuthCookieSession } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

/**
 * Looks up an existing (active) user by email.
 *
 * "Active" means the account already exists: unknown accounts are rejected,
 * accounts are only created manually / via seed. Shared by the passwordless
 * sign-in methods (magic link, OAuth).
 *
 * @returns the user, or `null` when no account matches the email
 */
export const findActiveUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    select: { email: true, id: true },
    where: { email },
  })
}

/**
 * Completes a sign-in for the given user: creates a session, sets the auth
 * cookie and redirects to the administration. Shared by the passwordless
 * sign-in methods (magic link, OAuth).
 *
 * Always throws: a redirect on success, or a DB error from `createSession`
 * (which never returns normally on failure). Callers `await` it as the final
 * step; nothing after the call runs.
 */
export const signInUser = async (request: Request, userId: string) => {
  const session = await createSession(userId)

  throw redirect('/administration', {
    headers: {
      'Set-Cookie': await setSessionAuthCookieSession(
        request,
        session.id,
        session.expirationDate,
      ),
    },
  })
}
