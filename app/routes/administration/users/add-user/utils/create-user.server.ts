import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type DataBase = {
  email: string
  name: string
  roleId: string
}

type DataWithNewAuthor = DataBase & {
  authorMode: 'new'
}

type DataWithExistingAuthor = DataBase & {
  authorMode: 'existing'
  existingAuthorId: string
}

type Data = DataWithNewAuthor | DataWithExistingAuthor

export const createUser = async (data: Data) => {
  try {
    return await prisma.$transaction(async (prisma) => {
      let authorId: string

      if (data.authorMode === 'new') {
        const author = await prisma.author.create({
          data: {
            name: data.name,
            role: {
              connect: {
                name: 'contributor',
              },
            },
          },
        })
        authorId = author.id
      } else {
        authorId = data.existingAuthorId
      }

      const user = await prisma.user.create({
        data: {
          author: {
            connect: {
              id: authorId,
            },
          },
          email: data.email,
          name: data.name,
          role: {
            connect: {
              id: data.roleId,
            },
          },
          username: data.email,
        },
        select: {
          id: true,
        },
      })

      return {
        createdAuthorId: data.authorMode === 'new' ? authorId : null,
        userId: user.id,
      }
    })
  } catch (error) {
    return throwDbError(error, 'Unable to create the user.')
  }
}
