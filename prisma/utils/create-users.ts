import type { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

import type { RoleName } from "./create-roles"

export type UsersData = {
  email: string
  username: string
  name: string
  password: string
  role: RoleName
}[]

export const createUsers = async (prisma: PrismaClient, data: UsersData) => {
  for (const user of data) {
    await prisma.user
      .create({
        data: {
          email: user.email,
          username: user.username,
          name: user.name,
          password: {
            create: {
              hash: bcrypt.hashSync(user.password, 10),
            },
          },
          role: {
            connect: { name: user.role },
          },
        },
      })
      .catch((error) => {
        console.error("Error creating a user:", error)
        return null
      })
  }
}
