import { parseWithZod } from '@conform-to/zod/v4'
import { MaxFileSizeExceededError } from '@mjackson/form-data-parser'
import { data, redirect } from 'react-router'

import { MAX_DECLARATION_BYTES } from '~/config/membership-application-config'
import { formatRetryAfter } from '~/utils/format-retry-after'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { checkHoneypot } from '~/utils/honeypot.server'
import { detectDeclarationType } from '~/utils/membership-application/detect-declaration-type'
import { generateApplicationCode } from '~/utils/membership-application/generate-application-code.server'
import { isMinorOnDate } from '~/utils/membership-application/is-minor-on-date'
import { readMembershipApplicationCookie } from '~/utils/membership-application/read-membership-application-cookie.server'
import { submitMembershipApplication } from '~/utils/membership-application/submit-membership-application.server'
import { writeMembershipApplicationCookie } from '~/utils/membership-application/write-membership-application-cookie.server'
import { rateLimitContext } from '~/utils/rate-limit.server'

import { detailsSchema, signatureSchema } from './_schema'
import { getStepPath, parseStepName } from './_step'
import type { Route } from './+types/route'

const FILE_TOO_LARGE =
  'Soubor je příliš velký. Nahrajte prosím menší, nejvýš 8 MB.'
const FILE_WRONG_TYPE = 'Nahrajte prosím soubor PDF, JPEG nebo PNG.'
const DETAILS_REJECTED =
  'Přihlášku se nepodařilo odeslat. Zkontrolujte prosím své údaje a zkuste to znovu.'
const UNAVAILABLE =
  'Přihlášku se teď nepodařilo odeslat. Údaje zůstaly vyplněné, zkuste to prosím později.'

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

  throw redirect(getStepPath('signature'), {
    headers: {
      'Set-Cookie': await writeMembershipApplicationCookie({
        code,
        details,
        state: 'details',
      }),
    },
    status: 303,
  })
}

const submitApplication = async (
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

  // Answered before the body is read, and without the form's own validation.
  const emptySubmission = parseWithZod(new FormData(), {
    schema: signatureSchema,
  })

  const limited = context.get(rateLimitContext)
  if (limited) {
    return data(
      {
        submissionResult: emptySubmission.reply({
          formErrors: [
            `Přihlášku se teď nepodařilo odeslat, odeslali jste ji příliš mnohokrát. Zkuste to prosím ${formatRetryAfter(limited.retryAfter)}.`,
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
          submissionResult: emptySubmission.reply({
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
          fieldErrors: { declaration: [FILE_WRONG_TYPE] },
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
            fieldErrors: { declaration: [FILE_WRONG_TYPE] },
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

export const action = async ({
  context,
  params,
  request,
}: Route.ActionArgs) => {
  switch (parseStepName(params.stepName)) {
    case 'details':
      return saveDetails(request)
    case 'signature':
      return submitApplication(request, context)
    default:
      throw redirect(getStepPath('details'), { status: 303 })
  }
}
