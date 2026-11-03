import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'
import { z } from 'zod'

import { checkPublicCSRF } from '~/utils/check-public-csrf.server'
import { issueEnrolmentLink } from '~/utils/editorial-board-enrolment/issue-enrolment-link.server'
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

  const refuseUntil = (retryAfter: number) =>
    data(
      {
        submissionResult: parseWithZod(formData, {
          schema: z.object({}),
        }).reply({
          formErrors: [
            `Přihlášku teď nelze odeslat. Zkuste to prosím ${formatRetryAfter(retryAfter)}.`,
          ],
        }),
      },
      { status: 429 },
    )

  const limited = context.get(rateLimitContext)
  if (limited) return refuseUntil(limited.retryAfter)

  const submission = parseWithZod(formData, { schema: enrolmentSchema })

  if (submission.status !== 'success') {
    return data({ submissionResult: submission.reply() }, { status: 400 })
  }

  const { firstName, interest, lastName, phone } = submission.value
  const email = submission.value.email.toLowerCase()

  // The sheet is not read here, so the page cannot tell a known address from a new one.
  const result = await issueEnrolmentLink(email, {
    formSubmittedAt: new Date().toISOString(),
    interest,
    name: `${firstName} ${lastName}`,
    phone,
  })

  if (result.status === 'limited') return refuseUntil(result.retryAfter)

  if (result.status === 'failed') {
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
