import type { PrismaClient } from "@prisma/client"

import {
  type UserPermissionAccess,
  type UserPermissionAction,
  type UserPermissionEntity,
} from "~~/types/permission"
import { type UserRoleLevel, type UserRoleName } from "~~/types/role"

export type UserRolesData = {
  name: UserRoleName
  level: UserRoleLevel
  permissions: {
    entity: UserPermissionEntity
    access: UserPermissionAccess
    actions: UserPermissionAction[]
  }[]
}[]

export const createUserRoles = async (
  prisma: PrismaClient,
  data: UserRolesData
) => {
  for (const role of data) {
    await prisma.userRole
      .create({
        data: {
          name: role.name,
          level: role.level,
          permissions: {
            connect: await prisma.userPermission.findMany({
              where: {
                OR: role.permissions.map((permission) => ({
                  entity: permission.entity,
                  access: permission.access,
                  action: { in: permission.actions },
                })),
              },
            }),
          },
        },
      })
      .catch((error) => {
        console.error("Error creating a role:", error)
        return null
      })
  }
}
