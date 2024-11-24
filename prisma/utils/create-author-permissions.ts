import type { PrismaClient } from "@prisma/client"

import {
  type AuthorPermissionAccess,
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
} from "~~/types/permission"

export type AuthorPermissionsData = {
  entities: AuthorPermissionEntity[]
  actions: AuthorPermissionAction[]
  accesses: AuthorPermissionAccess[]
}

export const createAuthorPermissions = async (
  prisma: PrismaClient,
  data: AuthorPermissionsData
) => {
  for (const entity of data.entities) {
    for (const action of data.actions) {
      for (const access of data.accesses) {
        await prisma.authorPermission
          .create({ data: { entity, action, access } })
          .catch((error) => {
            console.error("Error creating a permission:", error)
            return null
          })
      }
    }
  }
}
