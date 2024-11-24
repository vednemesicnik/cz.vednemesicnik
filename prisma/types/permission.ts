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
  | "delete"
  | "set_role"

export type PermissionAccess = "own" | "any"

export type UserPermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "assign_role_owner"
  | "assign_role_administrator"
  | "assign_role_user"
  | "assign_role_editor"
  | "assign_role_author"
  | "assign_role_contributor"

export type UserPermissionAccess = "own" | "any"

export type UserPermissionEntity = "user" | "author"

export type AuthorPermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "publish"

export type AuthorPermissionAccess = "own" | "any"

export type AuthorPermissionEntity =
  | "article"
  | "article_category"
  | "podcast"
  | "podcast_episode"
  | "podcast_episode_link"
  | "archived_issue"
  | "editorial_board_position"
  | "editorial_board_member"
