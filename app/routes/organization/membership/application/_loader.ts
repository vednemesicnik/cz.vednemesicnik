import { redirect } from 'react-router'

import { formatNumericDate } from '~/utils/format-numeric-date'
import { getHoneypotInputProps } from '~/utils/honeypot.server'
import { isMinorOnDate } from '~/utils/membership-application/is-minor-on-date'
import { readMembershipApplicationCookie } from '~/utils/membership-application/read-membership-application-cookie.server'

import { getStepPath, parseStepName } from './_step'
import type { Route } from './+types/route'

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
        honeypotInputProps,
        isMinor: isMinorOnDate(application.details.dateOfBirth, new Date()),
        step: 'signature' as const,
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
