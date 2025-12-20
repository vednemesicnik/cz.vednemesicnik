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
  for (const user of data) {
    await prisma.user
      .create({
        data: {
          author: {
            create: {
              name: user.name,
              role: {
                connect: { name: user.authorRole },
              },
            },
          },
          email: user.email,
          name: user.name,
          password: {
            create: {
              hash: bcrypt.hashSync(user.password, 10),
            },
          },
          role: {
            connect: { name: user.userRole },
          },
          username: user.email,
        },
      })
      .catch((error) => {
        console.error('Error creating a user:', error)
        return null
      })
  }
}
