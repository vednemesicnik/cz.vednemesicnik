import { parseWithZod } from '@conform-to/zod/v4'
import { data, redirect } from 'react-router'

import { buildSubmitRequest } from '~/utils/donation-request/build-submit-request'
import { isDonationEmailVerified } from '~/utils/donation-request/is-donation-email-verified'
import { issueDonationVerificationCode } from '~/utils/donation-request/issue-donation-verification-code.server'
import {
  type DonationRequestState,
  readDonationRequestCookie,
} from '~/utils/donation-request/read-donation-request-cookie.server'
import { submitDonationRequest } from '~/utils/donation-request/submit-donation-request.server'
import { writeDonationRequestCookie } from '~/utils/donation-request/write-donation-request-cookie.server'
import { checkVerificationCode } from '~/utils/email-verification/check-verification-code.server'
import { getVerificationCodeExpiry } from '~/utils/email-verification/get-verification-code-expiry'
import {
  verificationCodeSchema,
  WRONG_CODE,
} from '~/utils/email-verification/verification-code-schema'
import { formatRetryAfter } from '~/utils/format-retry-after'
import { checkHoneypot } from '~/utils/honeypot.server'
import { rateLimitContext } from '~/utils/rate-limit.server'

import { getStepPath } from '../_step'
import { parseIntent } from './_intent'
import type { Route } from './+types/route'

// Design 15m (8jxiph0x), copy thread 5uc4li12: the code's messages as for the
// membership application (15k, copy thread zup07jj5).
const NEW_CODE_SENT = 'Poslali jsme nový kód. Předchozí už neplatí.'
const NEW_CODE_NOT_SENT_KEEP_OLD =
  'Použijte dosavadní kód. Nový kód z tohoto pokusu nelze použít, ani pokud vám přišel e-mailem.'
const NEW_CODE_NOT_SENT =
  'Zkuste prosím znovu stisknout tlačítko Poslat nový kód. Kód z tohoto pokusu nelze použít, ani pokud vám přišel e-mailem.'
const NOT_VERIFIED =
  'Žádost se neodeslala, protože e-mail není ověřený. Ověřením e-mailu ji odešlete.'
const UNAVAILABLE =
  'Žádost se nepodařilo odeslat. Kód už zadávat nemusíte, zkuste ji prosím odeslat znovu.'
const sendLimited = (retryAfter: number) =>
  `Ověřovací kód teď nelze poslat. Zkuste to prosím ${formatRetryAfter(retryAfter)}.`
const triesLimited = (retryAfter: number) =>
  `Kód teď nelze ověřit. Zkuste to prosím ${formatRetryAfter(retryAfter)}.`

type DetailsState = Extract<DonationRequestState, { state: 'details' }>

/** A sentence above the step's forms, at most one (as design 15k). */
export type VerificationNotice = {
  message: string
  tone: 'error' | 'success'
}

const errorNotice = (message: string): VerificationNotice => ({
  message,
  tone: 'error',
})

/**
 * Sends the confirmed request. On success the cookie keeps only the request's
 * code for the sent page; otherwise it keeps the confirmed address, so the
 * next try needs no code. Details the script refused go back to the form,
 * where they can be corrected (15l).
 */
const submitRequest = async (saved: DetailsState) => {
  const verifiedState: DonationRequestState = {
    details: saved.details,
    requestId: saved.requestId,
    state: 'details',
    verifiedEmail: saved.details.email.toLowerCase(),
  }
  const result = await submitDonationRequest(
    buildSubmitRequest(saved.requestId, saved.details),
  )

  if (result.ok) {
    throw redirect(getStepPath('sent'), {
      headers: {
        'Set-Cookie': await writeDonationRequestCookie({
          requestId: saved.requestId,
          state: 'sent',
        }),
      },
      status: 303,
    })
  }

  const setCookie = await writeDonationRequestCookie(verifiedState)

  if (result.reason === 'rejected') {
    throw redirect(`${getStepPath('details')}?reason=rejected`, {
      headers: { 'Set-Cookie': setCookie },
      status: 303,
    })
  }

  return data(
    { notice: errorNotice(UNAVAILABLE) },
    { headers: { 'Set-Cookie': setCookie }, status: 503 },
  )
}

const verifyCode = async (
  request: Request,
  context: Route.ActionArgs['context'],
  saved: DetailsState,
) => {
  if (isDonationEmailVerified(saved)) {
    throw redirect(getStepPath('verify'), { status: 303 })
  }

  // Honeypot, then the limit, then the form: the body is a few bytes.
  const formData = await request.formData()

  checkHoneypot(formData)

  const limited = context.get(rateLimitContext)
  if (limited) {
    return data(
      { notice: errorNotice(triesLimited(limited.retryAfter)) },
      { status: 429 },
    )
  }

  const submission = parseWithZod(formData, { schema: verificationCodeSchema })

  if (submission.status !== 'success') {
    return data({ submissionResult: submission.reply() }, { status: 400 })
  }

  // No code yet, or an expired one: the page shows the expired state, and the
  // only way on is a new code.
  if (saved.verification === undefined) {
    return data({ submissionResult: submission.reply() }, { status: 400 })
  }

  const check = checkVerificationCode({
    code: submission.value.code,
    email: saved.details.email.toLowerCase(),
    issuedAt: saved.verification.issuedAt,
    now: Date.now(),
    purpose: 'donation-verify',
    secret: process.env.DONATION_VERIFICATION_SECRET ?? '',
  })

  switch (check) {
    case 'valid':
      return submitRequest(saved)
    case 'expired':
      return data({ submissionResult: submission.reply() }, { status: 400 })
    case 'wrong':
      return data(
        {
          submissionResult: submission.reply({
            fieldErrors: { code: [WRONG_CODE] },
          }),
        },
        { status: 400 },
      )
  }
}

const sendCode = async (request: Request, saved: DetailsState) => {
  if (isDonationEmailVerified(saved)) {
    throw redirect(getStepPath('verify'), { status: 303 })
  }

  const formData = await request.formData()

  checkHoneypot(formData)

  const hadLiveCode =
    getVerificationCodeExpiry(saved.verification?.issuedAt, Date.now()) !== null
  const issued = await issueDonationVerificationCode(
    saved.details.email.toLowerCase(),
    request,
  )

  if (issued.status === 'sent') {
    const notice: VerificationNotice = {
      message: NEW_CODE_SENT,
      tone: 'success',
    }
    return data(
      { notice },
      {
        headers: {
          'Set-Cookie': await writeDonationRequestCookie({
            details: saved.details,
            requestId: saved.requestId,
            state: 'details',
            verification: { issuedAt: issued.issuedAt },
          }),
        },
      },
    )
  }

  // The cookie stays as it was, so a live code stays live.
  return data(
    {
      notice: errorNotice(
        issued.status === 'limited'
          ? sendLimited(issued.retryAfter)
          : hadLiveCode
            ? NEW_CODE_NOT_SENT_KEEP_OLD
            : NEW_CODE_NOT_SENT,
      ),
    },
    { status: issued.status === 'limited' ? 429 : 503 },
  )
}

const submitAgain = async (
  request: Request,
  context: Route.ActionArgs['context'],
  saved: DetailsState,
) => {
  const formData = await request.formData()

  checkHoneypot(formData)

  // The page offers it only once the address is confirmed; this is a second tab
  // where the address changed, or a request made by hand.
  if (!isDonationEmailVerified(saved)) {
    return data({ notice: errorNotice(NOT_VERIFIED) }, { status: 403 })
  }

  const limited = context.get(rateLimitContext)
  if (limited) {
    return data(
      { notice: errorNotice(triesLimited(limited.retryAfter)) },
      { status: 429 },
    )
  }

  return submitRequest(saved)
}

export const action = async ({ context, request }: Route.ActionArgs) => {
  const saved = await readDonationRequestCookie(request)

  if (saved?.state === 'sent') {
    throw redirect(getStepPath('sent'), { status: 303 })
  }
  if (saved === null) {
    throw redirect(`${getStepPath('details')}?reason=expired`, { status: 303 })
  }

  switch (parseIntent(new URL(request.url))) {
    case 'verify-code':
      return verifyCode(request, context, saved)
    case 'send-code':
      return sendCode(request, saved)
    case 'submit':
      return submitAgain(request, context, saved)
    case null:
      throw redirect(getStepPath('verify'), { status: 303 })
  }
}
