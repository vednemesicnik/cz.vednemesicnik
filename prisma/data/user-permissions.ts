import type { UserPermissionsData } from "~~/utils/create-user-permissions"

export const userPermissions: UserPermissionsData = {
  entities: ["user", "author"],
  actions: [
    "view",
    "create",
    "update",
    "delete",
    "assign_role_owner",
    "assign_role_administrator",
    "assign_role_user",
    "assign_role_editor",
    "assign_role_author",
    "assign_role_contributor",
  ],
  accesses: ["own", "any"],
}
