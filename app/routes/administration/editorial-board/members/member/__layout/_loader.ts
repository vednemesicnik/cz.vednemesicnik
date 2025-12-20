import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { memberId } = params

  const member = await prisma.editorialBoardMember.findUnique({
    select: {
      fullName: true,
      id: true,
    },
    where: { id: memberId },
  })

  return { member }
}
