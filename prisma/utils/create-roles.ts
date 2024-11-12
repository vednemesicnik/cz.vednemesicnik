import type { PrismaClient } from "@prisma/client"

import {
  type PermissionAccess,
  type PermissionAction,
  type PermissionEntity,
} from "~~/types/permission"
import { type RoleName } from "~~/types/role"

export type RolesData = {
  name: RoleName
  permissions: {
    entity: PermissionEntity
    access: PermissionAccess
    actions: PermissionAction[]
  }[]
}[]

export const createRoles = async (prisma: PrismaClient, data: RolesData) => {
  for (const role of data) {
    await prisma.role
      .create({
        data: {
          name: role.name,
          permissions: {
            connect: await prisma.permission.findMany({
              select: { id: true },
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
