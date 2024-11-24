import type { PrismaClient } from "@prisma/client"

import {
  type AuthorPermissionAccess,
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
} from "~~/types/permission"
import { type AuthorRoleName } from "~~/types/role"

export type AuthorRolesData = {
  name: AuthorRoleName
  permissions: {
    entity: AuthorPermissionEntity
    access: AuthorPermissionAccess
    actions: AuthorPermissionAction[]
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
          permissions: {
            connect: await prisma.authorPermission.findMany({
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
