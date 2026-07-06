import { parseWithZod } from '@conform-to/zod/v4'
import { ALLOWED_EMAIL_DOMAIN } from '@constants/auth'
import { data } from 'react-router'

import { formatRetryAfter } from '~/utils/format-retry-after'
import { checkHoneypot } from '~/utils/honeypot.server'
import { createMagicLinkToken } from '~/utils/magic-link.server'
import { rateLimitContext } from '~/utils/rate-limit.server'
import { sendMagicLinkEmail } from '~/utils/send-magic-link-email.server'
import { findExistingUserByEmail } from '~/utils/sign-in.server'

import { schema } from './_schema'
import type { Route } from './+types/route'

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData()

  // Rate limited by the middleware (see _middleware.ts): surface an inline error
  // rather than sending. IP-based, so it doesn't leak account existence.
  const limited = context.get(rateLimitContext)
  if (limited) {
    const submission = parseWithZod(formData, { schema })
    return data(
      {
        sent: false,
        submissionResult: submission.reply({
          formErrors: [
            `Příliš mnoho požadavků. Zkuste to prosím ${formatRetryAfter(limited.retryAfter)}.`,
          ],
        }),
      },
      { status: 429 },
    )
  }

  checkHoneypot(formData)

  const submission = parseWithZod(formData, { schema })

  if (submission.status !== 'success') {
    return data(
      { sent: false, submissionResult: submission.reply() },
      { status: submission.status === 'error' ? 400 : 200 },
    )
  }

  const email = submission.value.email.trim().toLowerCase()

  // Send only when the email is on the allowed domain AND matches an existing
  // account. Every branch returns the same neutral response below — never reveal
  // which check failed (no account enumeration).
  if (email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    try {
      const user = await findExistingUserByEmail(email)

      if (user !== null) {
        const token = await createMagicLinkToken(email)

        const link = new URL(
          '/administration/sign-in/magic-link/verify',
          process.env.BASE_URL,
        )
        link.searchParams.set('token', token)
        link.searchParams.set('email', email)

        await sendMagicLinkEmail({ email, link: link.href })
      }
    } catch (error) {
      // Swallow failures (e.g. a DB error from the user lookup / token write):
      // they must not surface a non-neutral error only for existing accounts,
      // which would leak account existence. Log and fall through to neutral.
      console.error('[magic-link] failed to issue sign-in link —', error)
    }
  }

  return data({ sent: true, submissionResult: submission.reply() })
}
