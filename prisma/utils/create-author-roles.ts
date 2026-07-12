import type { PrismaClient } from '@generated/prisma/client'
import type {
  AuthorPermissionAccess,
  AuthorPermissionAction,
  AuthorPermissionEntity,
  AuthorRoleName,
  ContentState,
} from '@generated/prisma/enums'

export type AuthorRolesData = {
  name: AuthorRoleName
  level: number
  permissions: {
    entity: AuthorPermissionEntity
    access: AuthorPermissionAccess
    actions: AuthorPermissionAction[]
    state: ContentState
  }[]
}[]

export const createAuthorRoles = async (
  prisma: PrismaClient,
  data: AuthorRolesData,
) => {
  for (const role of data) {
    await prisma.authorRole
      .create({
        data: {
          level: role.level,
          name: role.name,
          permissions: {
            connect: await prisma.authorPermission.findMany({
              where: {
                OR: role.permissions.map((permission) => ({
                  access: permission.access,
                  action: { in: permission.actions },
                  entity: permission.entity,
                  state: permission.state,
                })),
              },
            }),
          },
        },
      })
      .catch((error) => {
        console.error('Error creating a role:', error)
        return null
      })
  }
}
