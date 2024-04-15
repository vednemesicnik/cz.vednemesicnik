import type { RolesData } from "../utils/create-roles"

export const roles: RolesData = [
  {
    // The owner is a user who cannot be deleted and has full access to all entities and all actions.
    name: "owner",
    permissions: [
      {
        entity: "archived_issue",
        access: "any",
        actions: ["create", "publish", "read", "update", "delete"],
      },
      {
        entity: "editorial_board_member",
        access: "any",
        actions: ["create", "publish", "read", "update", "delete"],
      },
      {
        entity: "editorial_board_member_position",
        access: "any",
        actions: ["create", "publish", "read", "update", "delete"],
      },
      {
        entity: "podcast",
        access: "any",
        actions: ["create", "publish", "read", "update", "delete"],
      },
      {
        entity: "podcast_episode",
        access: "any",
        actions: ["create", "publish", "read", "update", "delete"],
      },
    ],
  },
  {
    // The administrator is a user who has access to almost all entities except for the user entity and does not have access to delete actions.
    name: "administrator",
    permissions: [
      {
        entity: "archived_issue",
        access: "any",
        actions: ["publish", "read"],
      },
      {
        entity: "archived_issue",
        access: "own",
        actions: ["create", "publish", "read", "update"],
      },
    ],
  },
  {
    // Editor is user who can create, read, update, and publish but cannot delete.
    name: "editor",
    permissions: [
      {
        entity: "archived_issue",
        access: "any",
        actions: ["read"],
      },
    ],
  },
  {
    // Author is user who can create, read, and update but can only publish their own content and cannot delete.
    name: "author",
    permissions: [
      {
        entity: "archived_issue",
        access: "any",
        actions: ["read"],
      },
    ],
  },
  {
    // Contributor is user who can create, read, and update but cannot publish or delete.
    name: "contributor",
    permissions: [
      {
        entity: "archived_issue",
        access: "any",
        actions: ["read"],
      },
    ],
  },
]
