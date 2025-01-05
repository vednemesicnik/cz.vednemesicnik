import type { UserPermissionsData } from "~~/utils/create-user-permissions"

export const userPermissions: UserPermissionsData = {
  entities: ["user", "author"],
  actions: ["view", "create", "update", "delete"],
  accesses: ["own", "any"],
}
