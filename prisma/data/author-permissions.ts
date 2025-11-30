import { type AuthorPermissionsData } from "~~/utils/create-author-permissions"

export const authorPermissions: AuthorPermissionsData = {
  entities: [
    "article",
    "article_category",
    "article_tag",
    "podcast",
    "podcast_episode",
    "podcast_episode_link",
    "issue",
    "editorial_board_position",
    "editorial_board_member",
  ],
  actions: [
    "view",
    "create",
    "update",
    "delete",
    "publish",
    "retract",
    "archive",
    "restore",
    "review",
  ],
  accesses: ["own", "any"],
  states: ["draft", "published", "archived"],
}
