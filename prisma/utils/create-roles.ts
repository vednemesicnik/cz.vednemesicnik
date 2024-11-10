import type { PrismaClient } from "@prisma/client"

import type {
  PermissionAccess,
  PermissionAction,
  PermissionsEntity,
} from "./create-permissions"

export type RoleName =
  | "owner"
  | "administrator"
  | "editor"
  | "author"
  | "contributor"

export type RolesData = {
  name: RoleName
  permissions: {
    entity: PermissionsEntity
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
