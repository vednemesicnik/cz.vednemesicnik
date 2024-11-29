import type { UsersData } from "~~/utils/create-users"

export const users: UsersData = [
  {
    email: "owner@local.dev",
    name: "Vedneměsíčník, z. s.",
    password: "owner",
    userRole: "owner",
    authorRole: "editor",
  },
  {
    email: "admin@local.dev",
    name: "Admin",
    password: "admin",
    userRole: "administrator",
    authorRole: "editor",
  },
  {
    email: "editor@local.dev",
    name: "Editor",
    password: "editor",
    userRole: "user",
    authorRole: "editor",
  },
  {
    email: "author@local.dev",
    name: "Author",
    password: "author",
    userRole: "user",
    authorRole: "author",
  },
  {
    email: "contributor@local.dev",
    name: "Contributor",
    password: "contributor",
    userRole: "user",
    authorRole: "contributor",
  },
]
