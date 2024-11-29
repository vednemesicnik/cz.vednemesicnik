import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import {
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
  type UserPermissionAction,
  type UserPermissionEntity,
} from "~~/types/permission"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const userPermissionEntities: UserPermissionEntity[] = ["user", "author"]
  const userPermissionActions: UserPermissionAction[] = ["view"]

  const authorPermissionEntities: AuthorPermissionEntity[] = [
    "article",
    "article_category",
    "podcast",
    "issue",
    "editorial_board_position",
    "editorial_board_member",
  ]
  const authorPermissionActions: AuthorPermissionAction[] = ["view"]

  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      user: {
        select: {
          id: true,
          role: {
            select: {
              permissions: {
                where: {
                  entity: {
                    in: userPermissionEntities,
                  },
                  action: {
                    in: userPermissionActions,
                  },
                },
                select: {
                  entity: true,
                  action: true,
                  access: true,
                },
              },
            },
          },
          author: {
            select: {
              id: true,
              role: {
                select: {
                  permissions: {
                    where: {
                      entity: {
                        in: authorPermissionEntities,
                      },
                      action: {
                        in: authorPermissionActions,
                      },
                    },
                    select: {
                      entity: true,
                      action: true,
                      access: true,
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

  return json({ session })
}
