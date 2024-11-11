import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuthentication(request)

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      role: {
        name: "asc",
      },
    },
  })

  return json({ users })
}
