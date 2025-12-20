import type { PrismaClient } from '@generated/prisma/client'
import type {
  UserPermissionAccess,
  UserPermissionAction,
  UserPermissionEntity,
  UserRoleName,
} from '@generated/prisma/enums'

export type UserRolesData = {
  name: UserRoleName
  level: number
  permissions: {
    entity: UserPermissionEntity
    access: UserPermissionAccess
    actions: UserPermissionAction[]
  }[]
}[]

export const createUserRoles = async (
  prisma: PrismaClient,
  data: UserRolesData,
) => {
  for (const role of data) {
    await prisma.userRole
      .create({
        data: {
          level: role.level,
          name: role.name,
          permissions: {
            connect: await prisma.userPermission.findMany({
              where: {
                OR: role.permissions.map((permission) => ({
                  access: permission.access,
                  action: { in: permission.actions },
                  entity: permission.entity,
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
