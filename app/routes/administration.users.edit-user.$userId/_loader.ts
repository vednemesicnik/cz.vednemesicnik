import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/users/edit-user/:userId">,
  string
>

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { userId } = params as RouteParams
  const { sessionId } = await requireAuthentication(request)

  const sessionPromise = prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      user: {
        select: {
          id: true,
          role: {
            select: {
              permissions: {
                where: {
                  entity: "user",
                },
                select: {
                  action: true,
                  access: true,
                  entity: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const userPromise = prisma.user.findUniqueOrThrow({
    where: { id: userId },
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
  })

  const rolesPromise = prisma.role.findMany({
    where: {
      name: { not: "owner" },
    },
    select: {
      id: true,
      name: true,
    },
  })

  const [session, user, roles] = await Promise.all([
    sessionPromise,
    userPromise,
    rolesPromise,
  ])

  return json({ session, user, roles })
}
