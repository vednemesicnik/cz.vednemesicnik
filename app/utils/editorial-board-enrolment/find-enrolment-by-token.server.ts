import * as Sentry from '@sentry/react-router'
import { z } from 'zod'

import { ENROLMENT_VERIFICATION_TYPE } from '~/config/editorial-board-enrolment-config'
import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'

import type { EnrolmentPayload } from './create-enrolment-token.server'

const payloadSchema = z.object({
  formSubmittedAt: z.string(),
  interest: z.string().optional(),
  name: z.string(),
  phone: z.string(),
}) satisfies z.ZodType<EnrolmentPayload>

// Text that is not JSON counts as unreadable, like JSON of the wrong shape.
const parseJson = (text: string | null): unknown => {
  try {
    return JSON.parse(text ?? 'null')
  } catch {
    return null
  }
}

type Enrolment = {
  email: string
  payload: EnrolmentPayload
}

/**
 * Finds a pending enrolment by the token in its link, without consuming it. Opening the
 * link must change nothing: mail scanners open links on their own.
 *
 * @param token - The raw token.
 * @returns The address and the payload, or `null` for an unknown or expired token. A
 *   payload that no longer parses is reported to Sentry and counts as unknown, and the
 *   page then asks for a new form. A database failure is left to the caller.
 */
export const findEnrolmentByToken = async (
  token: string,
): Promise<Enrolment | null> => {
  const verification = await prisma.verification.findFirst({
    select: { payload: true, target: true },
    where: {
      expiresAt: { gt: new Date() },
      secret: getContentHash(token),
      type: ENROLMENT_VERIFICATION_TYPE,
    },
  })

  if (verification === null) return null

  const parsed = payloadSchema.safeParse(parseJson(verification.payload))

  if (!parsed.success) {
    console.error('[editorial-board-enrolment] unreadable payload.')
    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage('[editorial-board-enrolment] unreadable payload', {
        fingerprint: ['editorial-board-enrolment', 'unreadable-payload'],
        level: 'error',
      })
    }
    return null
  }

  return { email: verification.target, payload: parsed.data }
}
