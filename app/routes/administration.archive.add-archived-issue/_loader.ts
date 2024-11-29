import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { getRights } from "~/utils/permissions"
import {
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
} from "~~/types/permission"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const authorPermissionEntity: AuthorPermissionEntity = "issue"
  const authorPermissionActions: AuthorPermissionAction[] = [
    "create",
    "publish",
  ]

  const session = await prisma.session.findUniqueOrThrow({
    where: {
      id: sessionId,
    },
    select: {
      user: {
        select: {
          author: {
            select: {
              id: true,
              role: {
                select: {
                  permissions: {
                    where: {
                      entity: authorPermissionEntity,
                      action: { in: authorPermissionActions },
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
      },
    },
  })

  const [[canCreateAny]] = getRights(session.user.author.role.permissions, {
    actions: ["create"],
  })

  const authors = await prisma.author.findMany({
    ...(canCreateAny ? {} : { where: { id: session.user.author.id } }),
    select: {
      id: true,
      name: true,
    },
  })

  return json({ session, authors })
}
