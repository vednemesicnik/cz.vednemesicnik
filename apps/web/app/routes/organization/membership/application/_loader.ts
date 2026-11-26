import { redirect } from 'react-router'

import { formatDate } from '~/utils/format-date'
import { formatNumericDate } from '~/utils/format-numeric-date'
import { formatTime } from '~/utils/format-time'
import { getHoneypotInputProps } from '~/utils/honeypot.server'
import { getVerificationCodeExpiry } from '~/utils/membership-application/get-verification-code-expiry'
import { isEmailVerified } from '~/utils/membership-application/is-email-verified'
import { isMinorOnDate } from '~/utils/membership-application/is-minor-on-date'
import {
  type MembershipApplicationState,
  readMembershipApplicationCookie,
} from '~/utils/membership-application/read-membership-application-cookie.server'

import { getStepPath, parseStepName } from './_step'
import type { Route } from './+types/route'

// U+00A0, spelled out: in the source it would look like a plain space.
const NO_BREAK_SPACE = String.fromCodePoint(0xa0)

// A cookie from before the code (#972) has no `verification`, and is expired
// like a code past its lifetime: the way on is a new code (design 15k).
const getVerificationState = (
  application: Extract<MembershipApplicationState, { state: 'details' }>,
  now: number,
) => {
  if (isEmailVerified(application)) return { state: 'verified' as const }

  const expiresAt = getVerificationCodeExpiry(application, now)

  if (expiresAt === null) return { state: 'expired' as const }

  // `7. listopadu 2026 v 18:42`, in Prague time (copy thread zup07jj5), with no
  // break after the day and after the `v` (15k).
  const day = formatDate(expiresAt).replace(/^(\d+\.) /, `$1${NO_BREAK_SPACE}`)

  return {
    expiresAt: `${day} v${NO_BREAK_SPACE}${formatTime(expiresAt)}`,
    state: 'pending' as const,
  }
}

export const loader = async ({ params, request, url }: Route.LoaderArgs) => {
  const application = await readMembershipApplicationCookie(request)

  if (params.stepName === undefined) {
    throw redirect(
      getStepPath(application?.state === 'details' ? 'signature' : 'details'),
    )
  }

  const honeypotInputProps = getHoneypotInputProps()

  switch (parseStepName(params.stepName)) {
    case 'details': {
      return {
        details:
          application?.state === 'details'
            ? {
                ...application.details,
                dateOfBirth: formatNumericDate(
                  new Date(application.details.dateOfBirth),
                ),
              }
            : null,
        honeypotInputProps,
        isExpired: url.searchParams.get('reason') === 'expired',
        step: 'details' as const,
      }
    }

    case 'signature': {
      if (application?.state === 'sent') throw redirect(getStepPath('sent'))
      if (application === null) {
        throw redirect(`${getStepPath('details')}?reason=expired`)
      }

      return {
        email: application.details.email,
        honeypotInputProps,
        isMinor: isMinorOnDate(application.details.dateOfBirth, new Date()),
        step: 'signature' as const,
        verification: getVerificationState(application, Date.now()),
      }
    }

    case 'sent': {
      if (application?.state !== 'sent') throw redirect(getStepPath('details'))

      return {
        code: application.code,
        email: application.email,
        honeypotInputProps,
        step: 'sent' as const,
      }
    }

    default:
      throw redirect(getStepPath('details'))
  }
}
