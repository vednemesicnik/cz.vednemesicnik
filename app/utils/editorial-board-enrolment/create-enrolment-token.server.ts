import { randomBytes } from 'node:crypto'
import type { EnrolRequest } from '@generated/editorial-board-membership/response'

import {
  ENROLMENT_TOKEN_TTL_MS,
  ENROLMENT_VERIFICATION_TYPE,
} from '~/config/editorial-board-enrolment-config'
import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'

/** What the confirmation step sends to the sheet, besides the address in `target`. */
export type EnrolmentPayload = Pick<
  EnrolRequest,
  'formSubmittedAt' | 'interest' | 'name' | 'phone'
>

// 32 random bytes → 256 bits of entropy, transported base64url in the link.
const TOKEN_BYTES = 32

/**
 * Stores a pending enrolment: the token's hash and the payload in a `Verification`
 * row. It upserts on `target_type`, so a fresh request replaces the details and
 * invalidates the previous link. A database failure is left to the caller.
 *
 * @param email - The address, normalised by the caller.
 * @param payload - What the confirmation needs, kept out of the link.
 * @returns The raw token to put in the e-mailed link.
 */
export const createEnrolmentToken = async (
  email: string,
  payload: EnrolmentPayload,
): Promise<string> => {
  const token = randomBytes(TOKEN_BYTES).toString('base64url')
  const row = {
    expiresAt: new Date(Date.now() + ENROLMENT_TOKEN_TTL_MS),
    payload: JSON.stringify(payload),
    secret: getContentHash(token),
  }

  await prisma.verification.upsert({
    create: { ...row, target: email, type: ENROLMENT_VERIFICATION_TYPE },
    update: row,
    where: {
      target_type: { target: email, type: ENROLMENT_VERIFICATION_TYPE },
    },
  })

  return token
}
