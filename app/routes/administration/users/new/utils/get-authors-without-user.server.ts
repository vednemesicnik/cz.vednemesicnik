import { prisma } from '~/utils/db.server'

export const getAuthorsWithoutUser = async () => {
  return prisma.author.findMany({
    orderBy: {
      name: 'asc',
    },
    select: {
      id: true,
      name: true,
      role: {
        select: {
          name: true,
        },
      },
    },
    where: {
      user: null,
    },
  })
}
