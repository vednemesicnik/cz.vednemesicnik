import type { PrismaClient } from "@prisma/client"

export type PermissionsEntity =
  | "archived_issue"
  | "editorial_board_member"
  | "editorial_board_member_position"
  | "podcast"
  | "podcast_episode"
export type PermissionAction = "create" | "publish" | "read" | "update" | "delete"
export type PermissionAccess = "own" | "any"

export type PermissionsData = {
  entities: PermissionsEntity[]
  actions: PermissionAction[]
  accesses: PermissionAccess[]
}

export const createPermissions = async (prisma: PrismaClient, data: PermissionsData) => {
  for (const entity of data.entities) {
    for (const action of data.actions) {
      for (const access of data.accesses) {
        await prisma.permission.create({ data: { entity, action, access } }).catch((error) => {
          console.error("Error creating a permission:", error)
          return null
        })
      }
    }
  }
}
