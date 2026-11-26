import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type DataBase = {
  email: string
  roleId: string
}

type DataWithNewAuthor = DataBase & {
  authorMode: 'new'
  name: string
  authorRoleId: string
}

type DataWithExistingAuthor = DataBase & {
  authorMode: 'existing'
  existingAuthorId: string
}

type Data = DataWithNewAuthor | DataWithExistingAuthor

/**
 * Creates the account of Nový uživatel (design 28f) with its author: a new
 * one with the chosen name and author role, or an existing author without an
 * account, who keeps both. The account's own name is the author's.
 *
 * @param data.roleId - The user role, Člen or Administrátor, checked by the
 *   caller.
 * @returns The new account, and the new author's id, or `null` for an
 *   existing author.
 * @throws A 400 response for an author role that does not exist, or for an
 *   existing author who is gone or has an account by now.
 */
export const createUser = async (data: Data) => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const author =
        data.authorMode === 'new'
          ? await createAuthor(transaction, data)
          : await findAuthorWithoutUser(transaction, data.existingAuthorId)

      const user = await transaction.user.create({
        data: {
          author: { connect: { id: author.id } },
          email: data.email,
          name: author.name,
          role: { connect: { id: data.roleId } },
          username: data.email,
        },
        select: { id: true },
      })

      return {
        createdAuthorId: data.authorMode === 'new' ? author.id : null,
        userId: user.id,
      }
    })
  } catch (error) {
    return throwDbError(error, 'Unable to create the user.')
  }
}

type Transaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

const createAuthor = async (
  transaction: Transaction,
  { name, authorRoleId }: DataWithNewAuthor,
) => {
  const role = await transaction.authorRole.findUnique({
    select: { id: true },
    where: { id: authorRoleId },
  })

  if (role === null) {
    throw data(null, { status: 400 })
  }

  return transaction.author.create({
    data: { name, role: { connect: { id: role.id } } },
    select: { id: true, name: true },
  })
}

const findAuthorWithoutUser = async (
  transaction: Transaction,
  authorId: string,
) => {
  const author = await transaction.author.findUnique({
    select: { id: true, name: true },
    where: { id: authorId, user: null },
  })

  if (author === null) {
    throw data(null, { status: 400 })
  }

  return author
}
