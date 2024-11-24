import { type AuthorPermissionsData } from "~~/utils/create-author-permissions"

export const authorPermissions: AuthorPermissionsData = {
  entities: [
    "archived_issue",
    "podcast",
    "podcast_episode",
    "podcast_episode_link",
    "article",
    "article_category",
  ],
  actions: ["view", "create", "update", "delete", "publish"],
  accesses: ["own", "any"],
}
