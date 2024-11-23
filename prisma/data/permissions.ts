import type { PermissionsData } from "~~/utils/create-permissions"

export const permissions: PermissionsData = {
  entities: [
    "archived_issue",
    "editorial_board_member",
    "editorial_board_member_position",
    "podcast",
    "podcast_episode",
    "podcast_episode_link",
    "user_owner",
    "user_administrator",
    "user_editor",
    "user_author",
    "user_contributor",
  ],
  actions: ["create", "publish", "read", "update", "update_role", "delete"],
  accesses: ["own", "any"],
}
