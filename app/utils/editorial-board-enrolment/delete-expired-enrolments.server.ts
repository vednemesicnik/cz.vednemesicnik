import { ENROLMENT_VERIFICATION_TYPE } from '~/config/editorial-board-enrolment-config'
import { prisma } from '~/utils/db.server'

/**
 * Deletes the pending enrolments past their expiry, with the personal details they
 * hold: unlike a sign-in link, nothing has to use such a row up. Fire-and-forget;
 * driven by startEnrolmentRetention.
 */
export const deleteExpiredEnrolments = (): void => {
  void prisma.verification
    .deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        type: ENROLMENT_VERIFICATION_TYPE,
      },
    })
    .catch((error: unknown) => {
      console.error('Failed to delete expired enrolments', error)
    })
}
