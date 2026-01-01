import { getAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { isAuthenticated } = await getAuthentication(request)

  const editorialBoardMemberPositions =
    await prisma.editorialBoardPosition.findMany({
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
        members: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            fullName: true,
            id: true,
          },
          where: isAuthenticated
            ? {
                state: { in: ['published', 'draft'] },
              }
            : {
                state: 'published',
              },
        },
        pluralLabel: true,
      },
      where: isAuthenticated
        ? {
            state: { in: ['published', 'draft'] },
          }
        : {
            state: 'published',
          },
    })

  return { editorialBoardMemberPositions }
}
