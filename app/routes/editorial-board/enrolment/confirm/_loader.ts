import { findEnrolmentByToken } from '~/utils/editorial-board-enrolment/find-enrolment-by-token.server'
import { getHoneypotInputProps } from '~/utils/honeypot.server'

import type { Route } from './+types/route'

// Reads and nothing else: mail scanners and link previews open the address on their own,
// and only the button confirms (design 15e-confirm).
export const loader = async ({ request }: Route.LoaderArgs) => {
  const token = new URL(request.url).searchParams.get('token')
  const enrolment = token === null ? null : await findEnrolmentByToken(token)

  if (token === null || enrolment === null) {
    return { status: 'invalid' as const }
  }

  const { interest, name, phone } = enrolment.payload

  return {
    details: { email: enrolment.email, interest, name, phone },
    honeypotInputProps: getHoneypotInputProps(),
    status: 'valid' as const,
    token,
  }
}
