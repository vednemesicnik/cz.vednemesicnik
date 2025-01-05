import { type UserRolesData } from "~~/utils/create-user-roles"

export const userRoles: UserRolesData = [
  {
    name: "member",
    level: 3,
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
    level: 2,
    permissions: [
      {
        entity: "user",
        access: "any",
        actions: ["view", "create", "update", "delete"],
      },
      {
        entity: "author",
        access: "any",
        actions: ["view", "create", "update", "delete"],
      },
    ],
  },
  {
    name: "owner",
    level: 1,
    permissions: [
      {
        entity: "user",
        access: "any",
        actions: ["view", "create", "update", "delete"],
      },
      {
        entity: "author",
        access: "any",
        actions: ["view", "create", "update", "delete"],
      },
    ],
  },
]
