import { type AuthorRolesData } from "~~/utils/create-author-roles"

export const authorRoles: AuthorRolesData = [
  {
    name: "contributor",
    permissions: [
      {
        entity: "article",
        access: "own",
        actions: ["view", "create", "update", "delete"],
      },
      {
        entity: "podcast",
        access: "own",
        actions: ["view", "create", "update", "delete"],
      },
      {
        entity: "podcast_episode",
        access: "own",
        actions: ["view", "create", "update", "delete"],
      },
      {
        entity: "podcast_episode_link",
        access: "own",
        actions: ["view", "create", "update", "delete"],
      },
    ],
  },
  {
    name: "author",
    permissions: [
      {
        entity: "article",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "article_category",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "podcast",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "podcast_episode",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "podcast_episode_link",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "archived_issue",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "editorial_board_position",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "editorial_board_member",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
    ],
  },
  {
    name: "editor",
    permissions: [
      {
        entity: "article",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "article",
        access: "any",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "article_category",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "article_category",
        access: "any",
        actions: ["view", "create", "update", "delete", "publish"],
      },

      {
        entity: "podcast",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "podcast",
        access: "any",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "podcast_episode",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "podcast_episode",
        access: "any",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "podcast_episode_link",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "podcast_episode_link",
        access: "any",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "archived_issue",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "archived_issue",
        access: "any",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "editorial_board_position",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "editorial_board_position",
        access: "any",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "editorial_board_member",
        access: "own",
        actions: ["view", "create", "update", "delete", "publish"],
      },
      {
        entity: "editorial_board_member",
        access: "any",
        actions: ["view", "create", "update", "delete", "publish"],
      },
    ],
  },
]
