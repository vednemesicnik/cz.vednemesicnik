import bcrypt from "bcryptjs"

import { prisma } from "~/utils/db.server"

type Args = {
  email: string
  password: string
}

export const signIn = async ({ email, password }: Args) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: { select: { hash: true } },
    },
  })

  if (user === null || user.password === null) {
    return null
  }

  const isValid = await bcrypt.compare(password, user.password.hash)

  if (!isValid) {
    return null
  }

  return { id: user.id }
}
