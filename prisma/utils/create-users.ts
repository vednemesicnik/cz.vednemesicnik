import type { PrismaClient } from '@generated/prisma/client'
import type { AuthorRoleName, UserRoleName } from '@generated/prisma/enums'
import bcrypt from 'bcryptjs'

export type UsersData = {
  email: string
  name: string
  password: string
  userRole: UserRoleName
  authorRole: AuthorRoleName
}[]

export const createUsers = async (prisma: PrismaClient, data: UsersData) => {
  const users = []

  for (const userData of data) {
    const user = await prisma.user.create({
      data: {
        author: {
          create: {
            name: userData.name,
            role: {
              connect: { name: userData.authorRole },
            },
          },
        },
        email: userData.email,
        name: userData.name,
        password: {
          create: {
            hash: bcrypt.hashSync(userData.password, 10),
          },
        },
        role: {
          connect: { name: userData.userRole },
        },
        username: userData.email,
      },
      select: { authorId: true },
    })

    users.push(user)
  }

  return users
}
