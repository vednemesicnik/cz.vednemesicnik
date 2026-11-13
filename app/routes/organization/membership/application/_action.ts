import { parseWithZod } from '@conform-to/zod/v4'
import { MaxFileSizeExceededError } from '@mjackson/form-data-parser'
import { data, redirect } from 'react-router'
import { z } from 'zod'

import { MAX_DECLARATION_BYTES } from '~/config/membership-application-config'
import { checkVerificationCode } from '~/utils/email-verification/check-verification-code.server'
import { getVerificationCodeExpiry } from '~/utils/email-verification/get-verification-code-expiry'
import { formatRetryAfter } from '~/utils/format-retry-after'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { checkHoneypot } from '~/utils/honeypot.server'
import { detectDeclarationType } from '~/utils/membership-application/detect-declaration-type'
import { generateApplicationCode } from '~/utils/membership-application/generate-application-code.server'
import { isEmailVerified } from '~/utils/membership-application/is-email-verified'
import { isMinorOnDate } from '~/utils/membership-application/is-minor-on-date'
import { issueMembershipVerificationCode } from '~/utils/membership-application/issue-membership-verification-code.server'
import {
  type MembershipApplicationState,
  readMembershipApplicationCookie,
} from '~/utils/membership-application/read-membership-application-cookie.server'
import { submitMembershipApplication } from '~/utils/membership-application/submit-membership-application.server'
import { writeMembershipApplicationCookie } from '~/utils/membership-application/write-membership-application-cookie.server'
import { rateLimitContext } from '~/utils/rate-limit.server'

import { parseIntent } from './_intent'
import {
  DECLARATION_NOT_RECOGNISED,
  detailsSchema,
  signatureSchema,
  verificationCodeSchema,
  WRONG_CODE,
} from './_schema'
import { getStepPath, parseStepName } from './_step'
import type { Route } from './+types/route'

const FILE_TOO_LARGE =
  'Soubor je příliš velký. Nahrajte prosím menší, nejvýš 8 MB.'
const DETAILS_REJECTED =
  'Přihlášku se nepodařilo odeslat. Přes odkaz Opravit údaje prosím zkontrolujte své údaje a zkuste to znovu.'
const UNAVAILABLE =
  'Přihlášku se teď nepodařilo odeslat. Údaje zůstaly vyplněné, zkuste to prosím později.'

// The verification code (design 15k, copy thread zup07jj5).
const CODE_NOT_SENT =
  'Zkuste prosím znovu stisknout tlačítko Pokračovat. Kód z tohoto pokusu nelze použít, ani pokud vám přišel e-mailem. Údaje zůstaly vyplněné.'
const NEW_CODE_SENT = 'Poslali jsme nový kód. Předchozí už neplatí.'
const NEW_CODE_NOT_SENT_KEEP_OLD =
  'Použijte dosavadní kód. Nový kód z tohoto pokusu nelze použít, ani pokud vám přišel e-mailem.'
const NEW_CODE_NOT_SENT =
  'Zkuste prosím znovu stisknout tlačítko Poslat nový kód. Kód z tohoto pokusu nelze použít, ani pokud vám přišel e-mailem.'
const NOT_VERIFIED =
  'Přihláška se neodeslala, protože e-mail není ověřený. Ověřte ho, znovu nahrajte podepsané prohlášení a přihlášku odešlete.'
const sendLimited = (retryAfter: number) =>
  `Ověřovací kód teď nelze poslat. Zkuste to prosím ${formatRetryAfter(retryAfter)}.`
const triesLimited = (retryAfter: number) =>
  `Kód teď nelze ověřit. Zkuste to prosím ${formatRetryAfter(retryAfter)}.`

type DetailsState = Extract<MembershipApplicationState, { state: 'details' }>

/**
 * A sentence above the code form, at most one (design 15k). `source` says what
 * answered: after a code action the note under the links gives way to it.
 */
export type VerificationNotice = {
  message: string
  source: 'code' | 'submit'
  tone: 'error' | 'success'
}

const hasLiveCode = (application: DetailsState, now: number) =>
  getVerificationCodeExpiry(application.verification?.issuedAt, now) !== null

// Answered before the body is read, and without a form's own validation.
const emptySubmission = () =>
  parseWithZod(new FormData(), { schema: z.object({}) })

const saveDetails = async (request: Request) => {
  const formData = await request.formData()

  checkHoneypot(formData)

  const submission = parseWithZod(formData, { schema: detailsSchema })

  if (submission.status !== 'success') {
    return data({ submissionResult: submission.reply() }, { status: 400 })
  }

  const details = submission.value
  const application = await readMembershipApplicationCookie(request)

  // Unchanged details keep their code, so a retry stays one application. Changed
  // ones get a new code: the script would take the old one for a duplicate and
  // quietly keep the old details.
  const code =
    application?.state === 'details' &&
    JSON.stringify(application.details) === JSON.stringify(details)
      ? application.code
      : generateApplicationCode()

  // Only the address decides about the code: a verified address stays verified
  // and a live code stays live, so *Opravit údaje* without a new address mails
  // nothing. A new address needs a new code.
  const email = details.email.toLowerCase()
  const previous =
    application?.state === 'details' &&
    application.details.email.toLowerCase() === email
      ? application
      : null
  const toSignature = async (
    verification: Pick<DetailsState, 'verification' | 'verifiedEmail'>,
  ) =>
    redirect(getStepPath('signature'), {
      headers: {
        'Set-Cookie': await writeMembershipApplicationCookie({
          code,
          details,
          state: 'details',
          ...verification,
        }),
      },
      status: 303,
    })

  if (previous !== null && isEmailVerified(previous)) {
    throw await toSignature({ verifiedEmail: email })
  }
  if (previous !== null && hasLiveCode(previous, Date.now())) {
    throw await toSignature({ verification: previous.verification })
  }

  const issued = await issueMembershipVerificationCode(email, request)

  if (issued.status === 'sent') {
    throw await toSignature({ verification: { issuedAt: issued.issuedAt } })
  }

  // The cookie stays as it was: a code from this attempt never verifies, and the
  // next *Pokračovat* sends another.
  return data(
    {
      submissionResult: submission.reply({
        formErrors: [
          issued.status === 'limited'
            ? sendLimited(issued.retryAfter)
            : CODE_NOT_SENT,
        ],
      }),
    },
    { status: issued.status === 'limited' ? 429 : 503 },
  )
}

const verifyCode = async (
  request: Request,
  context: Route.ActionArgs['context'],
  application: DetailsState,
) => {
  if (isEmailVerified(application)) {
    throw redirect(getStepPath('signature'), { status: 303 })
  }

  // Honeypot, then the limit, then the form: the body is a few bytes.
  const formData = await request.formData()

  checkHoneypot(formData)

  const limited = context.get(rateLimitContext)
  if (limited) {
    const notice: VerificationNotice = {
      message: triesLimited(limited.retryAfter),
      source: 'code',
      tone: 'error',
    }
    return data({ notice }, { status: 429 })
  }

  const submission = parseWithZod(formData, { schema: verificationCodeSchema })

  if (submission.status !== 'success') {
    return data({ submissionResult: submission.reply() }, { status: 400 })
  }

  // No code yet, or an expired one: the page shows the expired state, and the
  // only way on is a new code.
  if (application.verification === undefined) {
    return data({ submissionResult: submission.reply() }, { status: 400 })
  }

  const email = application.details.email.toLowerCase()
  const check = checkVerificationCode({
    code: submission.value.code,
    email,
    issuedAt: application.verification.issuedAt,
    now: Date.now(),
    purpose: 'membership-verify',
    secret: process.env.MEMBERSHIP_VERIFICATION_SECRET ?? '',
  })

  switch (check) {
    case 'valid':
      throw redirect(getStepPath('signature'), {
        headers: {
          'Set-Cookie': await writeMembershipApplicationCookie({
            code: application.code,
            details: application.details,
            state: 'details',
            verifiedEmail: email,
          }),
        },
        status: 303,
      })
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

const sendCode = async (request: Request, application: DetailsState) => {
  if (isEmailVerified(application)) {
    throw redirect(getStepPath('signature'), { status: 303 })
  }

  const formData = await request.formData()

  checkHoneypot(formData)

  const hadLiveCode = hasLiveCode(application, Date.now())
  const issued = await issueMembershipVerificationCode(
    application.details.email.toLowerCase(),
    request,
  )

  if (issued.status === 'sent') {
    const notice: VerificationNotice = {
      message: NEW_CODE_SENT,
      source: 'code',
      tone: 'success',
    }
    return data(
      { notice },
      {
        headers: {
          'Set-Cookie': await writeMembershipApplicationCookie({
            code: application.code,
            details: application.details,
            state: 'details',
            verification: { issuedAt: issued.issuedAt },
          }),
        },
      },
    )
  }

  // The cookie stays as it was, so a live code stays live.
  const notice: VerificationNotice = {
    message:
      issued.status === 'limited'
        ? sendLimited(issued.retryAfter)
        : hadLiveCode
          ? NEW_CODE_NOT_SENT_KEEP_OLD
          : NEW_CODE_NOT_SENT,
    source: 'code',
    tone: 'error',
  }
  return data({ notice }, { status: issued.status === 'limited' ? 429 : 503 })
}

const submitApplication = async (
  request: Request,
  context: Route.ActionArgs['context'],
  application: DetailsState,
) => {
  // The page offers no upload before the address is verified; this is a second
  // tab where the address changed, or a request made by hand (design 15k). It
  // goes first: past the limit, the upload's own message would have no form.
  if (!isEmailVerified(application)) {
    const notice: VerificationNotice = {
      message: NOT_VERIFIED,
      source: 'submit',
      tone: 'error',
    }
    return data({ notice }, { status: 403 })
  }

  const limited = context.get(rateLimitContext)
  if (limited) {
    return data(
      {
        submissionResult: emptySubmission().reply({
          formErrors: [
            `Přihlášku teď nelze odeslat. Zkuste to prosím ${formatRetryAfter(limited.retryAfter)}.`,
          ],
        }),
      },
      { status: 429 },
    )
  }

  let formData: FormData
  try {
    formData = await getMultipartFormData(request, {
      maxFileSize: MAX_DECLARATION_BYTES,
      maxFiles: 1,
    })
  } catch (error) {
    if (error instanceof MaxFileSizeExceededError) {
      return data(
        {
          submissionResult: emptySubmission().reply({
            fieldErrors: { declaration: [FILE_TOO_LARGE] },
          }),
        },
        { status: 400 },
      )
    }
    throw new Response('Invalid form.', { status: 400 })
  }

  checkHoneypot(formData)

  const submission = parseWithZod(formData, { schema: signatureSchema })

  if (submission.status !== 'success') {
    return data({ submissionResult: submission.reply() }, { status: 400 })
  }

  const bytes = new Uint8Array(await submission.value.declaration.arrayBuffer())
  const mimeType = detectDeclarationType(bytes)

  if (mimeType === null) {
    return data(
      {
        submissionResult: submission.reply({
          fieldErrors: { declaration: [DECLARATION_NOT_RECOGNISED] },
        }),
      },
      { status: 400 },
    )
  }

  const { details } = application
  const result = await submitMembershipApplication({
    action: 'submit',
    address: details.address,
    code: application.code,
    dateOfBirth: details.dateOfBirth,
    declaration: {
      data: Buffer.from(bytes).toString('base64'),
      mimeType,
    },
    email: details.email,
    firstName: details.firstName,
    // Again on the day of submission, which is the day the statutes ask about.
    isMinor: isMinorOnDate(details.dateOfBirth, new Date()),
    lastName: details.lastName,
    phone: details.phone,
  })

  if (result.ok) {
    throw redirect(getStepPath('sent'), {
      headers: {
        'Set-Cookie': await writeMembershipApplicationCookie({
          code: result.code,
          email: details.email,
          state: 'sent',
        }),
      },
      status: 303,
    })
  }

  switch (result.reason) {
    case 'invalid_declaration':
      return data(
        {
          submissionResult: submission.reply({
            fieldErrors: { declaration: [DECLARATION_NOT_RECOGNISED] },
          }),
        },
        { status: 400 },
      )
    case 'rejected':
      return data(
        {
          submissionResult: submission.reply({
            formErrors: [DETAILS_REJECTED],
          }),
        },
        { status: 400 },
      )
    case 'unavailable':
      return data(
        { submissionResult: submission.reply({ formErrors: [UNAVAILABLE] }) },
        { status: 503 },
      )
  }
}

const signatureAction = async (
  request: Request,
  context: Route.ActionArgs['context'],
) => {
  const application = await readMembershipApplicationCookie(request)

  if (application?.state === 'sent') {
    throw redirect(getStepPath('sent'), { status: 303 })
  }
  if (application === null) {
    throw redirect(`${getStepPath('details')}?reason=expired`, { status: 303 })
  }

  switch (parseIntent(new URL(request.url))) {
    case 'verify-code':
      return verifyCode(request, context, application)
    case 'send-code':
      return sendCode(request, application)
    case null:
      return submitApplication(request, context, application)
  }
}

export const action = async ({
  context,
  params,
  request,
}: Route.ActionArgs) => {
  switch (parseStepName(params.stepName)) {
    case 'details':
      return saveDetails(request)
    case 'signature':
      return signatureAction(request, context)
    default:
      throw redirect(getStepPath('details'), { status: 303 })
  }
}
