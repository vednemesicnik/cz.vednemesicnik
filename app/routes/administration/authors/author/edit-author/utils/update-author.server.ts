import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type Data = {
  authorId: string
  name: string
  bio?: string
  roleId: string
}

export const updateAuthor = async ({ authorId, name, bio, roleId }: Data) => {
  try {
    await prisma.author.update({
      data: {
        bio: bio ?? null,
        name,
        role: {
          connect: {
            id: roleId,
          },
        },
      },
      where: { id: authorId },
    })
  } catch (error) {
    throwDbError(error, 'Unable to update the author.')
  }
}
