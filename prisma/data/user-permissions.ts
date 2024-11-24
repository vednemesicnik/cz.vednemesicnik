import type { UserPermissionsData } from "~~/utils/create-user-permissions"

export const userPermissions: UserPermissionsData = {
  entities: ["user", "editorial_board_member", "editorial_board_position"],
  actions: [
    "view",
    "create",
    "update",
    "delete",
    "assign_role_owner",
    "assign_role_administrator",
    "assign_role_editor",
  ],
  accesses: ["own", "any"],
}
