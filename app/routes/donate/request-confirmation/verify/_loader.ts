import { redirect } from 'react-router'

import { isDonationEmailVerified } from '~/utils/donation-request/is-donation-email-verified'
import { readDonationRequestCookie } from '~/utils/donation-request/read-donation-request-cookie.server'
import { formatVerificationExpiry } from '~/utils/email-verification/format-verification-expiry'
import { getVerificationCodeExpiry } from '~/utils/email-verification/get-verification-code-expiry'
import { getHoneypotInputProps } from '~/utils/honeypot.server'

import { getStepPath } from '../_step'
import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const saved = await readDonationRequestCookie(request)

  if (saved?.state === 'sent') throw redirect(getStepPath('sent'))
  if (saved === null) {
    throw redirect(`${getStepPath('details')}?reason=expired`)
  }

  const expiresAt = getVerificationCodeExpiry(
    saved.verification?.issuedAt,
    Date.now(),
  )

  return {
    email: saved.details.email,
    honeypotInputProps: getHoneypotInputProps(),
    verification: isDonationEmailVerified(saved)
      ? { state: 'verified' as const }
      : expiresAt === null
        ? { state: 'expired' as const }
        : {
            expiresAt: formatVerificationExpiry(expiresAt),
            state: 'pending' as const,
          },
    year: saved.details.year,
  }
}
