import type { UsersData } from "../utils/create-users"

export const users: UsersData = [
  {
    email: "owner@local.dev",
    username: "owner",
    name: "Owner",
    password: "owner",
    role: "owner",
  },
  {
    email: "admin@local.dev",
    username: "admin",
    name: "Admin",
    password: "admin",
    role: "administrator",
  },
  {
    email: "editor@local.dev",
    username: "editor",
    name: "Editor",
    password: "editor",
    role: "editor",
  },
  {
    email: "author@local.dev",
    username: "author",
    name: "Author",
    password: "author",
    role: "author",
  },
  {
    email: "contributor@local.dev",
    username: "contributor",
    name: "Contributor",
    password: "contributor",
    role: "contributor",
  },
]
