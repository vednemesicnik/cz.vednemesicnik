import * as Sentry from '@sentry/react-router'

import { createMagicLinkUrl } from '~/utils/magic-link/create-magic-link-url'
import { createMagicLinkToken } from '~/utils/magic-link.server'
import { sendMagicLinkEmail } from '~/utils/send-magic-link-email.server'
import { findExistingUserByEmail } from '~/utils/sign-in.server'

type IssueSignInLinkOptions = {
  email: string
  redirectTo: string
}

// Addresses with a link on its way. Another request for one adds nothing: its new
// token would kill the link in the mail still being sent, and that mail may arrive last.
const emailsInFlight = new Set<string>()

/**
 * Sends the sign-in link when the address has an account: the lookup, the token
 * write and the send, everything that depends on the account. The sign-in request
 * starts this without waiting, so its answer takes the same time either way
 * (log 0062). Nobody awaits the result, so this never rejects: failures are logged
 * and reported to Sentry.
 */
export const issueSignInLink = async ({
  email,
  redirectTo,
}: IssueSignInLinkOptions): Promise<void> => {
  if (emailsInFlight.has(email)) return

  emailsInFlight.add(email)

  try {
    const user = await findExistingUserByEmail(email)

    if (user === null) return

    const token = await createMagicLinkToken(email)

    // Carries where to land after the confirm click.
    const link = createMagicLinkUrl({
      baseUrl: process.env.BASE_URL,
      email,
      redirectTo,
      token,
    })

    await sendMagicLinkEmail({ email, link })
  } catch (error) {
    console.error('[magic-link] failed to issue sign-in link —', error)

    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage('[magic-link] failed to issue sign-in link', {
        // `throwDbError` throws a Response, and logs the Prisma code itself.
        extra: {
          error:
            error instanceof Response
              ? `Response ${error.status}`
              : String(error),
        },
        fingerprint: ['magic-link', 'issue-failed'],
        level: 'error',
      })
    }
  } finally {
    emailsInFlight.delete(email)
  }
}
