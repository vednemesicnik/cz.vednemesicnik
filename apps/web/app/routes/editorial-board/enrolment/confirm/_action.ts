import * as Sentry from '@sentry/react-router'
import { data, href, redirect } from 'react-router'

import { consumeEnrolmentToken } from '~/utils/editorial-board-enrolment/consume-enrolment-token.server'
import { findEnrolmentByToken } from '~/utils/editorial-board-enrolment/find-enrolment-by-token.server'
import { writeEnrolmentConfirmedCookie } from '~/utils/editorial-board-enrolment/write-enrolment-confirmed-cookie.server'
import { postEditorialBoardMembershipWrite } from '~/utils/editorial-board-membership.server'
import { checkHoneypot } from '~/utils/honeypot.server'

import type { Route } from './+types/route'

const CONFIRM_PATH = href('/editorial-board/enrolment/confirm')

// The page of the same link, which now says it cannot be used (design 15e-confirm).
const backToLink = (token: string) =>
  redirect(`${CONFIRM_PATH}?${new URLSearchParams({ token })}`, { status: 303 })

// The token stays, and the same button tries again.
const failed = () => data({ failed: true }, { status: 503 })

const reportDatabaseFailure = (error: unknown) => {
  console.error('[editorial-board-enrolment] confirming failed —', error)
  if (process.env.SENTRY_DSN) Sentry.captureException(error)
}

// No CSRF token: the link's token is the authority, a foreign page does not know it,
// and a CSRF cookie would only fail a link opened in another browser.
export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()

  checkHoneypot(formData)

  const token = formData.get('token')

  if (typeof token !== 'string') {
    throw redirect(CONFIRM_PATH, { status: 303 })
  }

  let enrolment: Awaited<ReturnType<typeof findEnrolmentByToken>>

  try {
    enrolment = await findEnrolmentByToken(token)
  } catch (error) {
    reportDatabaseFailure(error)
    return failed()
  }

  if (enrolment === null) throw backToLink(token)

  // The write first: spending the token first would lose the enrolment when the write
  // fails, and `enrol` is idempotent on the address, so a retry costs nothing.
  const write = await postEditorialBoardMembershipWrite({
    action: 'enrol',
    email: enrolment.email,
    ...enrolment.payload,
  })

  if (!write.ok) return failed()

  let isConsumed: boolean

  try {
    isConsumed = await consumeEnrolmentToken(token)
  } catch (error) {
    reportDatabaseFailure(error)
    return failed()
  }

  if (!isConsumed) throw backToLink(token)

  throw redirect(href('/editorial-board/enrolment/confirm/done'), {
    headers: { 'Set-Cookie': await writeEnrolmentConfirmedCookie() },
    status: 303,
  })
}
