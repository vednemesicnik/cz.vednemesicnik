import { parseWithZod } from '@conform-to/zod/v4'
import * as Sentry from '@sentry/react-router'
import { data, href, redirect } from 'react-router'
import { z } from 'zod'

import { checkPublicCSRF } from '~/utils/csrf.server'
import { createEnrolmentToken } from '~/utils/editorial-board-enrolment/create-enrolment-token.server'
import { writeEnrolmentSentCookie } from '~/utils/editorial-board-enrolment/write-enrolment-sent-cookie.server'
import { formatRetryAfter } from '~/utils/format-retry-after'
import { checkHoneypot } from '~/utils/honeypot.server'
import { rateLimitContext } from '~/utils/rate-limit.server'

import { enrolmentSchema } from './_schema'
import type { Route } from './+types/route'

const NOT_SENT = 'Přihlášku jsme neodeslali. Odešlete ji prosím znovu.'
const UNAVAILABLE =
  'Přihlášku se nepodařilo odeslat. Údaje zůstaly vyplněné, zkuste to znovu.'

export const action = async ({ context, request }: Route.ActionArgs) => {
  const formData = await request.formData()

  checkHoneypot(formData)

  const refusal = await checkPublicCSRF(formData, request, NOT_SENT)
  if (refusal !== null) return refusal

  const limited = context.get(rateLimitContext)
  if (limited) {
    return data(
      {
        submissionResult: parseWithZod(formData, {
          schema: z.object({}),
        }).reply({
          formErrors: [
            `Přihlášku teď nelze odeslat. Zkuste to prosím ${formatRetryAfter(limited.retryAfter)}.`,
          ],
        }),
      },
      { status: 429 },
    )
  }

  const submission = parseWithZod(formData, { schema: enrolmentSchema })

  if (submission.status !== 'success') {
    return data({ submissionResult: submission.reply() }, { status: 400 })
  }

  const { firstName, interest, lastName, phone } = submission.value
  const email = submission.value.email.toLowerCase()

  try {
    // The sheet is not read here, so the page cannot tell a known address from a new
    // one. #390 sends the returned token in the confirmation e-mail.
    await createEnrolmentToken(email, {
      formSubmittedAt: new Date().toISOString(),
      interest,
      name: `${firstName} ${lastName}`,
      phone,
    })
  } catch (error) {
    console.error('[editorial-board-enrolment] storing failed —', error)
    if (process.env.SENTRY_DSN) Sentry.captureException(error)

    return data(
      { submissionResult: submission.reply({ formErrors: [UNAVAILABLE] }) },
      { status: 503 },
    )
  }

  throw redirect(href('/editorial-board/enrolment/sent'), {
    headers: { 'Set-Cookie': await writeEnrolmentSentCookie(email) },
    status: 303,
  })
}
