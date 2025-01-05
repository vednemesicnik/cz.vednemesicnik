import type { PrismaClient } from "@prisma/client"

import {
  type AuthorPermissionAccess,
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
  type AuthorPermissionState,
} from "~~/types/permission"
import { type AuthorRoleLevel, type AuthorRoleName } from "~~/types/role"

export type AuthorRolesData = {
  name: AuthorRoleName
  level: AuthorRoleLevel
  permissions: {
    entity: AuthorPermissionEntity
    access: AuthorPermissionAccess
    actions: AuthorPermissionAction[]
    state: AuthorPermissionState
  }[]
}[]

export const createAuthorRoles = async (
  prisma: PrismaClient,
  data: AuthorRolesData
) => {
  for (const role of data) {
    await prisma.authorRole
      .create({
        data: {
          name: role.name,
          level: role.level,
          permissions: {
            connect: await prisma.authorPermission.findMany({
              where: {
                OR: role.permissions.map((permission) => ({
                  entity: permission.entity,
                  access: permission.access,
                  action: { in: permission.actions },
                  state: permission.state,
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
