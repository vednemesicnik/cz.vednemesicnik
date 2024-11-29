import type { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

import { type AuthorRoleName, type UserRoleName } from "~~/types/role"

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
          email: user.email,
          username: user.email,
          name: user.name,
          password: {
            create: {
              hash: bcrypt.hashSync(user.password, 10),
            },
          },
          role: {
            connect: { name: user.userRole },
          },
          author: {
            create: {
              name: user.name,
              role: {
                connect: { name: user.authorRole },
              },
            },
          },
        },
      })
      .catch((error) => {
        console.error("Error creating a user:", error)
        return null
      })
  }
}
