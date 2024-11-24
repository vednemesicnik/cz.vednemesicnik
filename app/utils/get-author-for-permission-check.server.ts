import { prisma } from "~/utils/db.server"
import {
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
} from "~~/types/permission"

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
