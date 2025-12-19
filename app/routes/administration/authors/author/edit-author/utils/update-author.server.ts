import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Data = {
  authorId: string
  name: string
  bio?: string
  roleId: string
}

export const updateAuthor = async ({ authorId, name, bio, roleId }: Data) => {
  try {
    await prisma.author.update({
      where: { id: authorId },
      data: {
        name,
        bio: bio ?? null,
        role: {
          connect: {
            id: roleId,
          },
        },
      },
    })
  } catch (error) {
    throwDbError(error, "Unable to update the author.")
  }
}
