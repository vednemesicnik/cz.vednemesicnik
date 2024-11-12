export type PermissionEntity =
  | "archived_issue"
  | "editorial_board_member"
  | "editorial_board_member_position"
  | "podcast"
  | "podcast_episode"
  | "podcast_episode_link"
  | "user"

export type PermissionAction =
  | "create"
  | "publish"
  | "read"
  | "update"
  | "delete"

export type PermissionAccess = "own" | "any"
