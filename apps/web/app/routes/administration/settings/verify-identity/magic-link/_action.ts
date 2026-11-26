import { ALLOWED_EMAIL_DOMAIN } from '@constants/auth'
import { data, href } from 'react-router'

import { requireActionSession } from '~/utils/auth.server'
import { checkCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { createMagicLinkUrl } from '~/utils/magic-link/create-magic-link-url'
import { createMagicLinkToken } from '~/utils/magic-link.server'
import { rateLimitContext } from '~/utils/rate-limit.server'
import { sendMagicLinkEmail } from '~/utils/send-magic-link-email.server'

import type { Route } from './+types/route'

// Sends the identity-check link (design 29d): the ordinary sign-in link to the
// signed-in user's own address, landing on Nastavení without a dialog. The
// person is signed in, so a failed send is said, unlike at sign-in.
export const action = async ({ request, context }: Route.ActionArgs) => {
  const { userId } = await requireActionSession(request)

  const formData = await request.formData()

  // The dialog stays open, so a stale token is its error line, not the
  // error boundary (design 30h); the layout then reissues the token.
  if ((await checkCSRF(formData, request)) !== null) {
    return data({ status: 'failed' as const }, { status: 403 })
  }

  const limited = context.get(rateLimitContext)
  if (limited) {
    return data(
      { retryAfter: limited.retryAfter, status: 'rate-limited' as const },
      { status: 429 },
    )
  }

  const user = await prisma.user.findUniqueOrThrow({
    select: { email: true },
    where: { id: userId },
  })

  // The confirmation page reads the address lower-cased, as sign-in does.
  const email = user.email.trim().toLowerCase()

  // Links go only to the domain sign-in accepts: opened in a signed-out
  // browser, this link signs in.
  if (!email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    return data({ status: 'failed' as const }, { status: 400 })
  }

  const token = await createMagicLinkToken(email)
  const isSent = await sendMagicLinkEmail({
    email,
    link: createMagicLinkUrl({
      baseUrl: process.env.BASE_URL,
      email,
      redirectTo: href('/administration/settings'),
      token,
    }),
  })

  if (!isSent) {
    return data({ status: 'failed' as const }, { status: 502 })
  }

  return data({ status: 'sent' as const })
}
