import type { PrismaClient } from "@prisma/client"

import {
  type AuthorPermissionAccess,
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
  type AuthorPermissionState,
} from "~~/types/permission"

export type AuthorPermissionsData = {
  entities: AuthorPermissionEntity[]
  actions: AuthorPermissionAction[]
  accesses: AuthorPermissionAccess[]
  states: AuthorPermissionState[]
}

export const createAuthorPermissions = async (
  prisma: PrismaClient,
  data: AuthorPermissionsData
) => {
  for (const entity of data.entities) {
    for (const state of data.states) {
      for (const access of data.accesses) {
        for (const action of data.actions) {
          await prisma.authorPermission
            .create({ data: { entity, action, access, state } })
            .catch((error) => {
              console.error("Error creating a permission:", error)
              return null
            })
        }
      }
    }
  }
}
