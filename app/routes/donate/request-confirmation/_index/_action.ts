import { parseWithZod } from '@conform-to/zod/v4'
import { data, redirect } from 'react-router'
import type { z } from 'zod'

import { generateRequestId } from '~/utils/donation-request/generate-request-id.server'
import { isDonationEmailVerified } from '~/utils/donation-request/is-donation-email-verified'
import { issueDonationVerificationCode } from '~/utils/donation-request/issue-donation-verification-code.server'
import { normalizeAccountNumber } from '~/utils/donation-request/normalize-account-number'
import {
  type DonationRequestDetails,
  type DonationRequestState,
  readDonationRequestCookie,
} from '~/utils/donation-request/read-donation-request-cookie.server'
import { writeDonationRequestCookie } from '~/utils/donation-request/write-donation-request-cookie.server'
import { getVerificationCodeExpiry } from '~/utils/email-verification/get-verification-code-expiry'
import { formatRetryAfter } from '~/utils/format-retry-after'
import { checkHoneypot } from '~/utils/honeypot.server'
import { rateLimitContext } from '~/utils/rate-limit.server'

import { getStepPath } from '../_step'
import { schema } from './_schema'
import type { Route } from './+types/route'

// Design 15l (8jxiph0x), worded as for the membership application (15k, copy
// thread zup07jj5). The form's own limit and the code's say the same: the code
// does not go now.
const CODE_NOT_SENT =
  'Zkuste prosím znovu stisknout tlačítko Pokračovat. Kód z tohoto pokusu nelze použít, ani pokud vám přišel e-mailem. Údaje zůstaly vyplněné.'
const sendLimited = (retryAfter: number) =>
  `Ověřovací kód teď nelze poslat. Zkuste to prosím ${formatRetryAfter(retryAfter)}.`

type DetailsState = Extract<DonationRequestState, { state: 'details' }>

// What the form posts, as the cookie keeps it: accounts and PSČ without spaces,
// an IBAN in capitals.
const toDetails = (value: z.output<typeof schema>): DonationRequestDetails => ({
  ...value,
  accounts: value.accounts.map(normalizeAccountNumber),
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
      submission.reply({ formErrors: [sendLimited(limited.retryAfter)] }),
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

  // The form stores nothing: a confirmed address takes the corrected request to
  // the verify step, which sends it (15m).
  if (previous !== null && isDonationEmailVerified(previous)) {
    throw await redirectWithCookie(getStepPath('verify'), {
      details,
      requestId,
      state: 'details',
      verifiedEmail: email,
    })
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
  // the next *Pokračovat* sends another.
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
