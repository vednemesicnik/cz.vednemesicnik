import type { PrismaClient } from "@generated/prisma/client"
import {
  type UserPermissionAccess,
  type UserPermissionAction,
  type UserPermissionEntity,
} from "@generated/prisma/enums"

export type UserPermissionsData = {
  entities: UserPermissionEntity[]
  actions: UserPermissionAction[]
  accesses: UserPermissionAccess[]
}

export const createUserPermissions = async (
  prisma: PrismaClient,
  data: UserPermissionsData
) => {
  for (const entity of data.entities) {
    for (const access of data.accesses) {
      for (const action of data.actions) {
        await prisma.userPermission
          .create({ data: { entity, action, access } })
          .catch((error) => {
            console.error("Error creating a permission:", error)
            return null
          })
      }
    }
  }
}
