import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'
import { z } from 'zod'

import { checkPublicCSRF } from '~/utils/check-public-csrf.server'
import { issueEnrolmentLink } from '~/utils/editorial-board-enrolment/issue-enrolment-link.server'
import { writeEnrolmentSentCookie } from '~/utils/editorial-board-enrolment/write-enrolment-sent-cookie.server'
import { checkHoneypot } from '~/utils/honeypot.server'
import { rateLimitContext } from '~/utils/rate-limit.server'

import { enrolmentSchema } from './_schema'
import type { Route } from './+types/route'

const NOT_SENT = 'Přihlášku jsme neodeslali. Odešlete ji prosím znovu.'
const UNAVAILABLE =
  'Přihlášku se nepodařilo odeslat. Údaje zůstaly vyplněné. Zkuste to prosím znovu.'
// No wait time: the public form carries no minute counts (copy thread `dw7ffilw`).
const LIMITED = 'Přihlášku teď nelze odeslat. Zkuste to prosím později.'

export const action = async ({ context, request }: Route.ActionArgs) => {
  const formData = await request.formData()

  checkHoneypot(formData)

  const refusal = await checkPublicCSRF(formData, request, NOT_SENT)
  if (refusal !== null) return refusal

  const refuseLimited = () =>
    data(
      {
        submissionResult: parseWithZod(formData, {
          schema: z.object({}),
        }).reply({ formErrors: [LIMITED] }),
      },
      { status: 429 },
    )

  if (context.get(rateLimitContext)) return refuseLimited()

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

  if (result.status === 'limited') return refuseLimited()

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
