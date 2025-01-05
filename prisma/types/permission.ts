import { type ContentState } from "~~/types/content-state"

export type UserPermissionAction = "view" | "create" | "update" | "delete"

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

export type AuthorPermissionState = ContentState
