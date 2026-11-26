import { verifyActivityToken } from '~/utils/editorial-board-activity/verify-activity-token.server'
import { formatNumericDate } from '~/utils/format-numeric-date'
import { getHoneypotInputProps } from '~/utils/honeypot.server'

import type { Route } from './+types/route'

// Reads and nothing else: mail scanners and link previews open the address on their own,
// and only the button writes (#385, decision 11). No database and no call to the script:
// the signature is all the page needs.
export const loader = async ({ request }: Route.LoaderArgs) => {
  const token = new URL(request.url).searchParams.get('token') ?? ''
  const verification = verifyActivityToken(
    token,
    process.env.GAS_EDITORIAL_BOARD_LINK_SECRET ?? '',
    Date.now(),
  )

  if (verification.status === 'invalid') {
    return { status: 'invalid' as const }
  }

  if (verification.status === 'expired') {
    return {
      action: verification.action,
      // The link stops at the start of a Prague day, so its last day is the one before,
      // the date the e-mail printed (design 15j).
      lastDay: formatNumericDate(
        new Date(verification.expiresAt.getTime() - 1),
      ),
      status: 'expired' as const,
    }
  }

  return {
    action: verification.action,
    email: verification.email,
    honeypotInputProps: getHoneypotInputProps(),
    status: 'valid' as const,
    token,
  }
}
