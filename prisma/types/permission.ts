export type PermissionEntity =
  | "archived_issue"
  | "editorial_board_member"
  | "editorial_board_member_position"
  | "podcast"
  | "podcast_episode"
  | "podcast_episode_link"
  | "user_owner"
  | "user_administrator"
  | "user_editor"
  | "user_author"
  | "user_contributor"

export type PermissionAction =
  | "create"
  | "publish"
  | "read"
  | "update"
  | "update_role"
  | "delete"

export type PermissionAccess = "own" | "any"
