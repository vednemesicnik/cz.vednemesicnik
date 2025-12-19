import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Data = {
  name: string
  bio?: string
  roleId: string
}

export const createAuthor = async ({ name, bio, roleId }: Data) => {
  try {
    const author = await prisma.author.create({
      data: {
        name,
        bio: bio ?? null,
        role: {
          connect: {
            id: roleId,
          },
        },
      },
      select: {
        id: true,
      },
    })

    return { authorId: author.id }
  } catch (error) {
    return throwDbError(error, "Unable to create the author.")
  }
}