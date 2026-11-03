import { ENROLMENT_VERIFICATION_TYPE } from '~/config/editorial-board-enrolment-config'
import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'

/**
 * Spends a token once its enrolment is on the sheet. The delete's count is the verdict,
 * so of two presses at once exactly one gets `true`, and a repeated write costs nothing
 * because `enrol` is idempotent on the address.
 *
 * @param token - The raw token.
 * @returns Whether this call spent it. A database failure is left to the caller.
 */
export const consumeEnrolmentToken = async (
  token: string,
): Promise<boolean> => {
  const { count } = await prisma.verification.deleteMany({
    where: {
      expiresAt: { gt: new Date() },
      secret: getContentHash(token),
      type: ENROLMENT_VERIFICATION_TYPE,
    },
  })

  return count === 1
}
