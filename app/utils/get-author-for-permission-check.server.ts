import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
} from '@generated/prisma/enums'
import { prisma } from '~/utils/db.server'

type Options = {
  actions: AuthorPermissionAction[]
  entities: AuthorPermissionEntity[]
}

export const getAuthorForPermissionCheck = async (
  sessionId: string,
  options: Options,
) => {
  const { actions, entities } = options

  const session = await prisma.session.findUniqueOrThrow({
    select: {
      user: {
        select: {
          author: {
            select: {
              id: true,
              role: {
                select: {
                  permissions: {
                    select: {
                      access: true,
                      action: true,
                      entity: true,
                      state: true,
                    },
                    where: {
                      action: { in: actions },
                      entity: { in: entities },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    where: { id: sessionId },
  })

  return {
    id: session.user.author.id,
    permissions: session.user.author.role.permissions,
  }
}
