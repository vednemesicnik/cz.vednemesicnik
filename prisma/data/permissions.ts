import type { PermissionsData } from "../utils/create-permissions"

export const permissions: PermissionsData = {
  entities: [
    "archived_issue",
    "editorial_board_member",
    "editorial_board_member_position",
    "podcast",
    "podcast_episode",
  ],
  actions: ["create", "publish", "read", "update", "delete"],
  accesses: ["own", "any"],
}
