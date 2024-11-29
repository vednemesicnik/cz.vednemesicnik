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
  | "retract"
  | "archive"
  | "restore"

export type AuthorPermissionAccess = "own" | "any"

export type AuthorPermissionEntity =
  | "article"
  | "article_tag"
  | "article_category"
  | "podcast"
  | "podcast_episode"
  | "podcast_episode_link"
  | "issue"
  | "editorial_board_position"
  | "editorial_board_member"
