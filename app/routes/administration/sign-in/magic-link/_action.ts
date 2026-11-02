import type { SubmissionResult } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { ALLOWED_EMAIL_DOMAIN } from '@constants/auth'
import { redirect } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import { formatRetryAfter } from '~/utils/format-retry-after'
import { checkHoneypot } from '~/utils/honeypot.server'
import { issueSignInLink } from '~/utils/magic-link/issue-sign-in-link.server'
import { rateLimitContext } from '~/utils/rate-limit.server'
import { safeRedirect } from '~/utils/safe-redirect'
import { flashSignInNotice } from '~/utils/sign-in-notice/flash-sign-in-notice.server'
import { withRedirectTo } from '~/utils/with-redirect-to'

import { schema } from './_schema'
import type { Route } from './+types/route'

// Not started in the same tick: the database driver is synchronous, so a token
// written before the answer leaves still delays it by a few milliseconds.
const ISSUE_LINK_DELAY_MS = 50

// Every answer redirects (post/redirect/get): the request page itself only
// shows the sent state, and a direct visit goes back to the chooser (20a).
export const action = async ({ request, context }: Route.ActionArgs) => {
  // Enforce the auth boundary in the handler, not just the loader: a direct POST
  // must not let an already-signed-in admin request a link and swap sessions.
  await requireUnauthenticated(request)

  const formData = await request.formData()

  // Honeypot first: reject bot/malformed submissions before anything else, so it
  // runs even for rate-limited requests (consistent with the other form actions).
  checkHoneypot(formData)

  const redirectTo = safeRedirect(formData.get('redirectTo'))

  // A rejected request goes back to the chooser's field (20b, right column).
  const backToChooser = async (submissionResult: SubmissionResult<string[]>) =>
    redirect(withRedirectTo('/administration/sign-in', redirectTo), {
      headers: {
        'Set-Cookie': await flashSignInNotice(request, {
          kind: 'magic-link-rejected',
          submissionResult,
        }),
      },
      status: 303,
    })

  const submission = parseWithZod(formData, { schema })

  // Rate limited by the middleware (see _middleware.ts): said at the field,
  // without sending. IP-based, so it doesn't leak account existence.
  const limited = context.get(rateLimitContext)
  if (limited) {
    throw await backToChooser(
      submission.reply({
        fieldErrors: {
          email: [
            `Zkuste si odkaz poslat ${formatRetryAfter(limited.retryAfter)} — limit odesílání byl vyčerpán.`,
          ],
        },
      }),
    )
  }

  if (submission.status !== 'success') {
    throw await backToChooser(submission.reply())
  }

  const email = submission.value.email.trim().toLowerCase()

  // A link goes only to an existing account. Every branch lands on the same
  // neutral sent state below, and the work starts after that answer has left, so
  // neither the answer nor the time it takes says whether the account exists (no
  // account enumeration, log 0062). The domain check repeats the schema's, so the
  // user lookup never runs off the domain.
  if (email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    setTimeout(
      () => void issueSignInLink({ email, redirectTo }),
      ISSUE_LINK_DELAY_MS,
    )
  }

  // The sent page repeats the address: a typo is the usual reason no link
  // arrives, and echoing what was typed reveals nothing about accounts (20b).
  throw redirect(
    withRedirectTo('/administration/sign-in/magic-link', redirectTo),
    {
      headers: {
        'Set-Cookie': await flashSignInNotice(request, {
          email,
          kind: 'magic-link-sent',
        }),
      },
      status: 303,
    },
  )
}
