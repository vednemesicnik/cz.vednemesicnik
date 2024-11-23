import type { RolesData } from "~~/utils/create-roles"

export const roles: RolesData = [
  {
    name: "owner",
    permissions: [
      // Archived Issue:
      // - Any access: read, create, publish, update, delete
      // - Own access: read, create, publish, update, delete
      {
        entity: "archived_issue",
        access: "any",
        actions: ["read", "create", "publish", "update", "delete"],
      },
      {
        entity: "archived_issue",
        access: "own",
        actions: ["read", "create", "publish", "update", "delete"],
      },

      // Editorial Board Member:
      // - Any access: read, create, update, delete
      // - Own access: read, create, update, delete
      {
        entity: "editorial_board_member",
        access: "any",
        actions: ["read", "create", "update", "delete"],
      },
      {
        entity: "editorial_board_member",
        access: "own",
        actions: ["read", "create", "update", "delete"],
      },

      // Editorial Board Member Position:
      // - Any access: read, create, update, delete
      // - Own access: read, create, update, delete
      {
        entity: "editorial_board_member_position",
        access: "any",
        actions: ["read", "create", "update", "delete"],
      },
      {
        entity: "editorial_board_member_position",
        access: "own",
        actions: ["read", "create", "update", "delete"],
      },

      // Podcast:
      // - Any access: read, create, update, publish, delete
      // - Own access: read, create, update, publish, delete
      {
        entity: "podcast",
        access: "any",
        actions: ["read", "create", "update", "publish", "delete"],
      },
      {
        entity: "podcast",
        access: "own",
        actions: ["read", "create", "update", "publish", "delete"],
      },

      // Podcast Episode:
      // - Any access: read, create, update, publish, delete
      // - Own access: read, create, update, publish, delete
      {
        entity: "podcast_episode",
        access: "any",
        actions: ["read", "create", "update", "publish", "delete"],
      },
      {
        entity: "podcast_episode",
        access: "own",
        actions: ["read", "create", "update", "publish", "delete"],
      },

      // Podcast Episode Link:
      // - Any access: read, create, update, publish, delete
      // - Own access: read, create, update, publish, delete
      {
        entity: "podcast_episode_link",
        access: "any",
        actions: ["read", "create", "update", "delete"],
      },
      {
        entity: "podcast_episode_link",
        access: "own",
        actions: ["read", "create", "update", "delete"],
      },

      // User - owner:
      // - Any access: read, update
      // - Own access: read, update
      {
        entity: "user_owner",
        access: "any",
        actions: ["read", "update"],
      },
      {
        entity: "user_owner",
        access: "own",
        actions: ["read", "update"],
      },

      // User - administrator:
      // - Any access: read, create, update, update role, delete
      // - Own access: read, create, update, update role, delete
      {
        entity: "user_administrator",
        access: "any",
        actions: ["read", "create", "update", "update_role", "delete"],
      },
      {
        entity: "user_administrator",
        access: "own",
        actions: ["read", "create", "update", "update_role", "delete"],
      },

      // User - editor:
      // - Any access: read, create, update, update role, delete
      // - Own access: read, create, update, update role, delete
      {
        entity: "user_editor",
        access: "any",
        actions: ["read", "create", "update", "update_role", "delete"],
      },
      {
        entity: "user_editor",
        access: "own",
        actions: ["read", "create", "update", "update_role", "delete"],
      },

      // User - author:
      // - Any access: read, create, update, update role, delete
      // - Own access: read, create, update, update role, delete
      {
        entity: "user_author",
        access: "any",
        actions: ["read", "create", "update", "update_role", "delete"],
      },
      {
        entity: "user_author",
        access: "own",
        actions: ["read", "create", "update", "update_role", "delete"],
      },

      // User - contributor:
      // - Any access: read, create, update, update role, delete
      // - Own access: read, create, update, update role, delete
      {
        entity: "user_contributor",
        access: "any",
        actions: ["read", "create", "update", "update_role", "delete"],
      },
      {
        entity: "user_contributor",
        access: "own",
        actions: ["read", "create", "update", "update_role", "delete"],
      },
    ],
  },
  {
    name: "administrator",
    permissions: [
      // Archived Issue:
      // - Any access: read, create, update, publish, delete
      // - Own access: read, create, update, publish, delete
      {
        entity: "archived_issue",
        access: "any",
        actions: ["read", "create", "update", "publish", "delete"],
      },
      {
        entity: "archived_issue",
        access: "own",
        actions: ["read", "create", "update", "publish", "delete"],
      },

      // Editorial Board Member:
      // - Any access: read, create, update, delete
      // - Own access: read, create, update, delete
      {
        entity: "editorial_board_member",
        access: "any",
        actions: ["read", "create", "update", "delete"],
      },
      {
        entity: "editorial_board_member",
        access: "own",
        actions: ["read", "create", "update", "delete"],
      },

      // Editorial Board Member Position:
      // - Any access: read, create, update, delete
      // - Own access: read, create, update, delete
      {
        entity: "editorial_board_member_position",
        access: "any",
        actions: ["read", "create", "update", "delete"],
      },
      {
        entity: "editorial_board_member_position",
        access: "own",
        actions: ["read", "create", "update", "delete"],
      },

      // Podcast:
      // - Any access: read, create, update, publish, delete
      // - Own access: read, create, update, publish, delete
      {
        entity: "podcast",
        access: "any",
        actions: ["read", "create", "update", "publish", "delete"],
      },
      {
        entity: "podcast",
        access: "own",
        actions: ["read", "create", "update", "publish", "delete"],
      },

      // Podcast Episode:
      // - Any access: read, create, update, publish, delete
      // - Own access: read, create, update, publish, delete
      {
        entity: "podcast_episode",
        access: "any",
        actions: ["read", "create", "update", "publish", "delete"],
      },
      {
        entity: "podcast_episode",
        access: "own",
        actions: ["read", "create", "update", "publish", "delete"],
      },

      // Podcast Episode Link:
      // - Any access: read, create, update, publish, delete
      // - Own access: read, create, update, publish, delete
      {
        entity: "podcast_episode_link",
        access: "any",
        actions: ["read", "create", "update", "delete"],
      },
      {
        entity: "podcast_episode_link",
        access: "own",
        actions: ["read", "create", "update", "delete"],
      },

      // User - administrator:
      // - Any access: read, update
      // - Own access: read, update
      {
        entity: "user_administrator",
        access: "any",
        actions: ["read", "update"],
      },
      {
        entity: "user_administrator",
        access: "own",
        actions: ["read", "update"],
      },

      // User - editor:
      // - Any access: read, create, update, update role, delete
      // - Own access: read, create, update, update role, delete
      {
        entity: "user_editor",
        access: "any",
        actions: ["read", "create", "update", "update_role", "delete"],
      },
      {
        entity: "user_editor",
        access: "own",
        actions: ["read", "create", "update", "update_role", "delete"],
      },

      // User - author:
      // - Any access: read, create, update, update role, delete
      // - Own access: read, create, update, update role, delete
      {
        entity: "user_author",
        access: "any",
        actions: ["read", "create", "update", "update_role", "delete"],
      },
      {
        entity: "user_author",
        access: "own",
        actions: ["read", "create", "update", "update_role", "delete"],
      },

      // User - contributor:
      // - Any access: read, create, update, update role, delete
      // - Own access: read, create, update, update role, delete
      {
        entity: "user_contributor",
        access: "any",
        actions: ["read", "create", "update", "update_role", "delete"],
      },
      {
        entity: "user_contributor",
        access: "own",
        actions: ["read", "create", "update", "update_role", "delete"],
      },
    ],
  },
  {
    name: "editor",
    permissions: [
      // Archived Issue:
      // - Any access: read, create, update, publish
      // - Own access: read, create, update, publish
      {
        entity: "archived_issue",
        access: "any",
        actions: ["read", "create", "update", "publish"],
      },
      {
        entity: "archived_issue",
        access: "own",
        actions: ["read", "create", "update", "publish"],
      },

      // Editorial Board Member:
      // - Any access: read, create, update
      // - Own access: read, create, update
      {
        entity: "editorial_board_member",
        access: "any",
        actions: ["read", "create", "update"],
      },
      {
        entity: "editorial_board_member",
        access: "own",
        actions: ["read", "create", "update"],
      },

      // Editorial Board Member Position:
      // - Any access: read, create, update
      // - Own access: read, create, update
      {
        entity: "editorial_board_member_position",
        access: "any",
        actions: ["read", "create", "update"],
      },
      {
        entity: "editorial_board_member_position",
        access: "own",
        actions: ["read", "create", "update"],
      },

      // Podcast:
      // - Any access: read, create, update, publish
      // - Own access: read, create, update, publish
      {
        entity: "podcast",
        access: "any",
        actions: ["read", "create", "update", "publish"],
      },
      {
        entity: "podcast",
        access: "own",
        actions: ["read", "create", "update", "publish"],
      },

      // Podcast Episode:
      // - Any access: read, create, update, publish
      // - Own access: read, create, update, publish
      {
        entity: "podcast_episode",
        access: "any",
        actions: ["read", "create", "update", "publish"],
      },
      {
        entity: "podcast_episode",
        access: "own",
        actions: ["read", "create", "update", "publish"],
      },

      // Podcast Episode Link:
      // - Any access: read, create, update, publish
      // - Own access: read, create, update, publish
      {
        entity: "podcast_episode_link",
        access: "any",
        actions: ["read", "create", "update", "publish"],
      },
      {
        entity: "podcast_episode_link",
        access: "own",
        actions: ["read", "create", "update", "publish"],
      },
    ],
  },
  {
    name: "author",
    permissions: [
      // Archived Issue:
      // - Any access: read
      // - Own access: read, create, update, publish
      {
        entity: "archived_issue",
        access: "any",
        actions: ["read"],
      },
      {
        entity: "archived_issue",
        access: "own",
        actions: ["read", "create", "update", "publish"],
      },

      // Editorial Board Member:
      // - Any access: read
      // - Own access: read, create, update
      {
        entity: "editorial_board_member",
        access: "any",
        actions: ["read"],
      },
      {
        entity: "editorial_board_member",
        access: "own",
        actions: ["read", "create", "update"],
      },

      // Editorial Board Member Position:
      // - Any access: read
      // - Own access: read, create, update
      {
        entity: "editorial_board_member_position",
        access: "any",
        actions: ["read"],
      },
      {
        entity: "editorial_board_member_position",
        access: "own",
        actions: ["read", "create", "update"],
      },

      // Podcast:
      // - Any access: read
      // - Own access: read, create, update, publish
      {
        entity: "podcast",
        access: "any",
        actions: ["read"],
      },
      {
        entity: "podcast",
        access: "own",
        actions: ["read", "create", "update", "publish"],
      },

      // Podcast Episode:
      // - Any access: read
      // - Own access: read, create, update, publish
      {
        entity: "podcast_episode",
        access: "any",
        actions: ["read"],
      },
      {
        entity: "podcast_episode",
        access: "own",
        actions: ["read", "create", "update", "publish"],
      },

      // Podcast Episode Link:
      // - Any access: read
      // - Own access: read, create, update, publish
      {
        entity: "podcast_episode_link",
        access: "any",
        actions: ["read"],
      },
      {
        entity: "podcast_episode_link",
        access: "own",
        actions: ["read", "create", "update", "publish"],
      },
    ],
  },
  {
    name: "contributor",
    permissions: [
      // Archived Issue:
      // - Any access: read
      // - Own access: read, create, update
      {
        entity: "archived_issue",
        access: "any",
        actions: ["read"],
      },
      {
        entity: "archived_issue",
        access: "own",
        actions: ["read", "create", "update"],
      },

      // Podcast:
      // - Any access: read
      // - Own access: read, create, update
      {
        entity: "podcast",
        access: "any",
        actions: ["read"],
      },
      {
        entity: "podcast",
        access: "own",
        actions: ["read", "create", "update"],
      },

      // Podcast Episode:
      // - Any access: read
      // - Own access: read, create, update
      {
        entity: "podcast_episode",
        access: "any",
        actions: ["read"],
      },
      {
        entity: "podcast_episode",
        access: "own",
        actions: ["read", "create", "update"],
      },

      // Podcast Episode Link:
      // - Any access: read
      // - Own access: read, create, update
      {
        entity: "podcast_episode_link",
        access: "any",
        actions: ["read"],
      },
      {
        entity: "podcast_episode_link",
        access: "own",
        actions: ["read", "create", "update"],
      },
    ],
  },
]
