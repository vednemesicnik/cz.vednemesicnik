import {
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
} from "@generated/prisma/enums"
import { prisma } from "~/utils/db.server"

type Options = {
  actions: AuthorPermissionAction[]
  entities: AuthorPermissionEntity[]
}

export const getAuthorForPermissionCheck = async (
  sessionId: string,
  options: Options
) => {
  const { actions, entities } = options

  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
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
                      entity: { in: entities },
                      action: { in: actions },
                    },
                    select: {
                      access: true,
                      action: true,
                      entity: true,
                      state: true,
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

  return {
    id: session.user.author.id,
    permissions: session.user.author.role.permissions,
  }
}
