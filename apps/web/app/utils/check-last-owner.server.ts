import { invariantResponse } from '@epic-web/invariant'

import { prisma } from '~/utils/db.server'

/**
 * Checks if deleting a user would remove the last Owner from the system.
 * Throws an error if the user is the only Owner.
 *
 * According to the security policy, there must always be at least one Owner
 * in the system to maintain administrative control.
 *
 * @param userId - The ID of the user being deleted
 * @throws Error if the user is the only Owner in the system
 */
export async function checkLastOwner(userId: string): Promise<void> {
  const targetUser = await prisma.user.findUniqueOrThrow({
    select: {
      role: {
        select: {
          name: true,
        },
      },
    },
    where: { id: userId },
  })

  // Only check if the target user is an Owner
  if (targetUser.role.name === 'owner') {
    const ownerCount = await prisma.user.count({
      where: { role: { name: 'owner' } },
    })

    invariantResponse(
      ownerCount > 1,
      'Nelze smazat jediného Ownera v systému. Systém musí mít alespoň jednoho Ownera.',
    )
  }
}
