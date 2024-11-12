import type { PrismaClient } from "@prisma/client"

import {
  type PermissionAccess,
  type PermissionAction,
  type PermissionEntity,
} from "~~/types/permission"

export type PermissionsData = {
  entities: PermissionEntity[]
  actions: PermissionAction[]
  accesses: PermissionAccess[]
}

export const createPermissions = async (
  prisma: PrismaClient,
  data: PermissionsData
) => {
  for (const entity of data.entities) {
    for (const action of data.actions) {
      for (const access of data.accesses) {
        await prisma.permission
          .create({ data: { entity, action, access } })
          .catch((error) => {
            console.error("Error creating a permission:", error)
            return null
          })
      }
    }
  }
}
