import { parseWithZod } from '@conform-to/zod/v4'
import { ALLOWED_EMAIL_DOMAIN } from '@constants/auth'
import { data } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import { formatRetryAfter } from '~/utils/format-retry-after'
import { checkHoneypot } from '~/utils/honeypot.server'
import { createMagicLinkUrl } from '~/utils/magic-link/create-magic-link-url'
import { createMagicLinkToken } from '~/utils/magic-link.server'
import { rateLimitContext } from '~/utils/rate-limit.server'
import { safeRedirect } from '~/utils/safe-redirect'
import { sendMagicLinkEmail } from '~/utils/send-magic-link-email.server'
import { findExistingUserByEmail } from '~/utils/sign-in.server'

import { schema } from './_schema'
import type { Route } from './+types/route'

export const action = async ({ request, context }: Route.ActionArgs) => {
  // Enforce the auth boundary in the handler, not just the loader: a direct POST
  // must not let an already-signed-in admin request a link and swap sessions.
  await requireUnauthenticated(request)

  const formData = await request.formData()

  // Honeypot first: reject bot/malformed submissions before anything else, so it
  // runs even for rate-limited requests (consistent with the other form actions).
  checkHoneypot(formData)

  // Rate limited by the middleware (see _middleware.ts): surface an inline error
  // rather than sending. IP-based, so it doesn't leak account existence.
  const limited = context.get(rateLimitContext)
  if (limited) {
    const submission = parseWithZod(formData, { schema })
    return data(
      {
        sent: false as const,
        submissionResult: submission.reply({
          formErrors: [
            `Příliš mnoho požadavků. Zkuste to prosím ${formatRetryAfter(limited.retryAfter)}.`,
          ],
        }),
      },
      { status: 429 },
    )
  }

  const submission = parseWithZod(formData, { schema })

  if (submission.status !== 'success') {
    return data(
      { sent: false as const, submissionResult: submission.reply() },
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

        // Carries where to land after the confirm click.
        const link = createMagicLinkUrl({
          baseUrl: process.env.BASE_URL,
          email,
          redirectTo: safeRedirect(formData.get('redirectTo')),
          token,
        })

        await sendMagicLinkEmail({ email, link })
      }
    } catch (error) {
      // Swallow failures (e.g. a DB error from the user lookup / token write):
      // they must not surface a non-neutral error only for existing accounts,
      // which would leak account existence. Log and fall through to neutral.
      console.error('[magic-link] failed to issue sign-in link —', error)
    }
  }

  // The page repeats the address: a typo is the usual reason no link arrives,
  // and echoing what was typed reveals nothing about accounts (20b).
  return data({
    email,
    sent: true as const,
    submissionResult: submission.reply(),
  })
}
