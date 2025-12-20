import type {
  UserPermissionAccess,
  UserPermissionAction,
  UserPermissionEntity,
} from '@generated/prisma/enums'
import { requireAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { getUserRights } from '~/utils/permissions/core/get-user-rights'

type GetUserPermissionContextOptions = {
  entities: UserPermissionEntity[]
  actions: UserPermissionAction[]
}

export async function getUserPermissionContext(
  request: Request,
  options: GetUserPermissionContextOptions,
) {
  const { sessionId } = await requireAuthentication(request)

  const session = await prisma.session.findUniqueOrThrow({
    select: {
      user: {
        select: {
          authorId: true,
          id: true,
          role: {
            select: {
              level: true,
              name: true,
              permissions: {
                select: {
                  access: true,
                  action: true,
                  entity: true,
                },
                where: {
                  action: { in: options.actions },
                  entity: { in: options.entities },
                },
              },
            },
          },
        },
      },
    },
    where: { id: sessionId },
  })

  const user = session.user

  if (!user.role) {
    throw new Error(
      'User does not have an associated role. Cannot determine permissions.',
    )
  }

  return {
    authorId: user.authorId,

    can: (config: {
      entity: UserPermissionEntity
      action: UserPermissionAction
      access?: UserPermissionAccess[]
      targetUserId?: string
      targetUserRoleLevel?: number
    }) => {
      const access = config.access ?? ['own', 'any']

      const result = getUserRights(user.role.permissions, {
        access,
        actions: [config.action],
        entities: [config.entity],
        ownId: user.id,
        targetId: config.targetUserId,
      })

      // Result structure: [entity][action][access]
      // [0] = first entity (we only pass 1)
      // [0][0] = first action (we only pass 1)
      // [0][0][0] = "own" access (first in access array)
      // [0][0][1] = "any" access (second in access array)
      const hasOwn = result[0][0][0]
      const hasAny = result[0][0][1]

      // Role hierarchy protection: Users can only modify accounts with level >= their level
      // Administrators (level 2) cannot modify Owner accounts (level 1)
      // because 1 < 2 (Owner level is lower/more powerful than Administrator level)
      let hasPermission = hasOwn || hasAny

      if (
        config.targetUserRoleLevel !== undefined &&
        config.targetUserRoleLevel < user.role.level
      ) {
        hasPermission = false
      }

      return {
        hasAny,
        hasOwn,
        hasPermission,
      }
    },
    permissions: user.role.permissions,
    roleLevel: user.role.level,
    roleName: user.role.name,
    userId: user.id,
  }
}

export type UserPermissionContext = Awaited<
  ReturnType<typeof getUserPermissionContext>
>
