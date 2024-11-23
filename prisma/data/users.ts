import type { UsersData } from "~~/utils/create-users"

export const users: UsersData = [
  {
    email: "owner@local.dev",
    username: "owner@local.dev",
    name: "Vedneměsíčník, z. s.",
    password: "owner",
    role: "owner",
  },
  {
    email: "admin@local.dev",
    username: "admin@local.dev",
    name: "Admin",
    password: "admin",
    role: "administrator",
  },
  {
    email: "editor@local.dev",
    username: "editor@local.dev",
    name: "Editor",
    password: "editor",
    role: "editor",
  },
  {
    email: "author@local.dev",
    username: "author@local.dev",
    name: "Author",
    password: "author",
    role: "author",
  },
  {
    email: "contributor@local.dev",
    username: "contributor@local.dev",
    name: "Contributor",
    password: "contributor",
    role: "contributor",
  },
]
