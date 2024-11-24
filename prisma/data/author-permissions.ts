import { type AuthorPermissionsData } from "~~/utils/create-author-permissions"

export const authorPermissions: AuthorPermissionsData = {
  entities: [
    "article",
    "article_category",
    "podcast",
    "podcast_episode",
    "podcast_episode_link",
    "archived_issue",
    "editorial_board_position",
    "editorial_board_member",
  ],
  actions: ["view", "create", "update", "delete", "publish"],
  accesses: ["own", "any"],
}
