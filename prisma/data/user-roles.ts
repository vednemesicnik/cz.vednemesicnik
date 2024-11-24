import { type UserRolesData } from "~~/utils/create-user-roles"

export const userRoles: UserRolesData = [
  {
    name: "user",
    permissions: [
      {
        entity: "user",
        access: "own",
        actions: ["view", "update"],
      },
      {
        entity: "author",
        access: "own",
        actions: ["view", "update"],
      },
    ],
  },
  {
    name: "administrator",
    permissions: [
      {
        entity: "user",
        access: "own",
        actions: [
          "view",
          "create",
          "update",
          "delete",
          "assign_role_administrator",
          "assign_role_user",
        ],
      },
      {
        entity: "user",
        access: "any",
        actions: [
          "view",
          "create",
          "update",
          "delete",
          "assign_role_administrator",
          "assign_role_editor",
        ],
      },
      {
        entity: "author",
        access: "own",
        actions: [
          "view",
          "create",
          "update",
          "delete",
          "assign_role_editor",
          "assign_role_author",
          "assign_role_contributor",
        ],
      },
      {
        entity: "author",
        access: "any",
        actions: [
          "view",
          "create",
          "update",
          "delete",
          "assign_role_editor",
          "assign_role_author",
          "assign_role_contributor",
        ],
      },
    ],
  },
  {
    name: "owner",
    permissions: [
      {
        entity: "user",
        access: "own",
        actions: [
          "view",
          "create",
          "update",
          "delete",
          "assign_role_owner",
          "assign_role_administrator",
          "assign_role_editor",
        ],
      },
      {
        entity: "user",
        access: "any",
        actions: [
          "view",
          "create",
          "update",
          "delete",
          "assign_role_owner",
          "assign_role_administrator",
          "assign_role_editor",
        ],
      },
      {
        entity: "author",
        access: "own",
        actions: [
          "view",
          "create",
          "update",
          "delete",
          "assign_role_editor",
          "assign_role_author",
          "assign_role_contributor",
        ],
      },
      {
        entity: "author",
        access: "any",
        actions: [
          "view",
          "create",
          "update",
          "delete",
          "assign_role_editor",
          "assign_role_author",
          "assign_role_contributor",
        ],
      },
    ],
  },
]
