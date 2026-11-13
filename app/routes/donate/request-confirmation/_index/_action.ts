import { parseWithZod } from '@conform-to/zod/v4'
import { data, redirect } from 'react-router'
import type { z } from 'zod'

import { buildSubmitRequest } from '~/utils/donation-request/build-submit-request'
import { generateRequestId } from '~/utils/donation-request/generate-request-id.server'
import { isDonationEmailVerified } from '~/utils/donation-request/is-donation-email-verified'
import { issueDonationVerificationCode } from '~/utils/donation-request/issue-donation-verification-code.server'
import {
  type DonationRequestDetails,
  type DonationRequestState,
  readDonationRequestCookie,
} from '~/utils/donation-request/read-donation-request-cookie.server'
import { submitDonationRequest } from '~/utils/donation-request/submit-donation-request.server'
import { writeDonationRequestCookie } from '~/utils/donation-request/write-donation-request-cookie.server'
import { getVerificationCodeExpiry } from '~/utils/email-verification/get-verification-code-expiry'
import { formatRetryAfter } from '~/utils/format-retry-after'
import { checkHoneypot } from '~/utils/honeypot.server'
import { rateLimitContext } from '~/utils/rate-limit.server'

import { getStepPath } from '../_step'
import { schema } from './_schema'
import type { Route } from './+types/route'

// Design 15l (hjjdkbb6); the code's messages as for the membership application
// (15k, copy thread zup07jj5).
const NOT_SENT = 'Žádost se nepodařilo odeslat. Zkuste to prosím znovu.'
const UNAVAILABLE = 'Server je dočasně nedostupný. Zkuste to prosím za chvíli.'
const CODE_NOT_SENT =
  'Zkuste prosím znovu stisknout tlačítko Odeslat žádost. Kód z tohoto pokusu nelze použít, ani pokud vám přišel e-mailem. Údaje zůstaly vyplněné.'
const tooMany = (retryAfter: number) =>
  `Příliš mnoho požadavků. Zkuste to prosím ${formatRetryAfter(retryAfter)}.`
const sendLimited = (retryAfter: number) =>
  `Ověřovací kód teď nelze poslat. Zkuste to prosím ${formatRetryAfter(retryAfter)}.`

type DetailsState = Extract<DonationRequestState, { state: 'details' }>

// What the form posts, as the cookie keeps it: accounts and PSČ without spaces.
const toDetails = (value: z.output<typeof schema>): DonationRequestDetails => ({
  ...value,
  accounts: value.accounts.map((account) => account.trim()),
  address: { ...value.address, zip: value.address.zip.replace(/\s/g, '') },
})

const redirectWithCookie = async (path: string, state: DonationRequestState) =>
  redirect(path, {
    headers: { 'Set-Cookie': await writeDonationRequestCookie(state) },
    status: 303,
  })

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData()

  const limited = context.get(rateLimitContext)
  if (limited) {
    const submission = parseWithZod(formData, { schema })
    return data(
      submission.reply({ formErrors: [tooMany(limited.retryAfter)] }),
      { status: 429 },
    )
  }

  checkHoneypot(formData)

  const submission = parseWithZod(formData, { schema })
  if (submission.status !== 'success') {
    return data(submission.reply(), { status: 400 })
  }

  const details = toDetails(submission.value)
  const saved = await readDonationRequestCookie(request)

  // Unchanged details keep their code, so a retry stays one request. Changed
  // ones get a new code: the script would take the old one for a duplicate and
  // quietly keep the old details.
  const requestId =
    saved?.state === 'details' &&
    JSON.stringify(saved.details) === JSON.stringify(details)
      ? saved.requestId
      : generateRequestId(details.year)

  // Only the address decides about the code: a verified address stays verified
  // and a live code stays live, so correcting the details mails nothing.
  const email = details.email.toLowerCase()
  const previous: DetailsState | null =
    saved?.state === 'details' && saved.details.email.toLowerCase() === email
      ? saved
      : null

  if (previous !== null && isDonationEmailVerified(previous)) {
    // The address is confirmed: the corrected request goes at once.
    const result = await submitDonationRequest(
      buildSubmitRequest(requestId, details),
    )

    if (result.ok) {
      throw await redirectWithCookie(getStepPath('sent'), {
        requestId,
        state: 'sent',
      })
    }

    return data(
      submission.reply({
        formErrors: [result.reason === 'rejected' ? NOT_SENT : UNAVAILABLE],
      }),
      {
        headers: {
          'Set-Cookie': await writeDonationRequestCookie({
            details,
            requestId,
            state: 'details',
            verifiedEmail: email,
          }),
        },
        status: result.reason === 'rejected' ? 400 : 503,
      },
    )
  }

  if (
    previous !== null &&
    getVerificationCodeExpiry(previous.verification?.issuedAt, Date.now()) !==
      null
  ) {
    throw await redirectWithCookie(getStepPath('verify'), {
      details,
      requestId,
      state: 'details',
      verification: previous.verification,
    })
  }

  const issued = await issueDonationVerificationCode(email, request)

  if (issued.status === 'sent') {
    throw await redirectWithCookie(getStepPath('verify'), {
      details,
      requestId,
      state: 'details',
      verification: { issuedAt: issued.issuedAt },
    })
  }

  // The cookie stays as it was: a code from this attempt never verifies, and
  // the next *Odeslat žádost* sends another.
  return data(
    submission.reply({
      formErrors: [
        issued.status === 'limited'
          ? sendLimited(issued.retryAfter)
          : CODE_NOT_SENT,
      ],
    }),
    { status: issued.status === 'limited' ? 429 : 503 },
  )
}
