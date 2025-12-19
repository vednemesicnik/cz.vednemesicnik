import { prisma } from "~/utils/db.server"

export const getAuthorsWithoutUser = async () => {
  return prisma.author.findMany({
    where: {
      user: null,
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
    orderBy: {
      name: "asc",
    },
  })
}