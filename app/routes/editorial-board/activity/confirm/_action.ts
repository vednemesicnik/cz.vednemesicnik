import { data, href, redirect } from 'react-router'

import { verifyActivityToken } from '~/utils/editorial-board-activity/verify-activity-token.server'
import { writeActivityAnsweredCookie } from '~/utils/editorial-board-activity/write-activity-answered-cookie.server'
import {
  type EditorialBoardMembershipError,
  postEditorialBoardMembershipWrite,
} from '~/utils/editorial-board-membership.server'
import { checkHoneypot } from '~/utils/honeypot.server'

import type { Route } from './+types/route'

const CONFIRM_PATH = href('/editorial-board/activity/confirm')

// The script's answers about the person: the address is not on the sheet, is shared, or
// is no longer in the state the link was for. One page for all of them (design 15j).
const UNUSABLE_ERRORS = new Set<EditorialBoardMembershipError>([
  'ambiguous',
  'not_active',
  'not_found',
  'not_removed',
])

/**
 * Writes the answer the link carries. No CSRF token, as on the enrolment confirmation:
 * the signed link is the authority, a foreign page does not know it, and a CSRF cookie
 * would only fail a link opened in another browser. The token is checked again here,
 * because the form can be posted without the page.
 */
export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()

  checkHoneypot(formData)

  const token = formData.get('token')

  if (typeof token !== 'string') {
    throw redirect(CONFIRM_PATH, { status: 303 })
  }

  const verification = verifyActivityToken(
    token,
    process.env.GAS_EDITORIAL_BOARD_LINK_SECRET ?? '',
    Date.now(),
  )

  // The page of the same link, which says why it no longer works.
  if (verification.status !== 'valid') {
    throw redirect(`${CONFIRM_PATH}?${new URLSearchParams({ token })}`, {
      status: 303,
    })
  }

  const write = await postEditorialBoardMembershipWrite({
    action: verification.action,
    email: verification.email,
  })

  if (!write.ok) {
    // The link stays, and the same button tries again.
    return UNUSABLE_ERRORS.has(write.error)
      ? data({ result: 'unusable' as const }, { status: 409 })
      : data({ result: 'failed' as const }, { status: 503 })
  }

  // A repeat ends here too: the result is the same, and nobody needs to know which press
  // wrote it (design 15j).
  throw redirect(href('/editorial-board/activity/confirm/done'), {
    headers: {
      'Set-Cookie': await writeActivityAnsweredCookie(verification.action),
    },
    status: 303,
  })
}
