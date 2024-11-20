import type { UsersData } from "~~/utils/create-users"

export const users: UsersData = [
  // The first user is the owner of the site
  {
    email: "spolek@vednemesicnik.cz",
    username: "vednemesicnik",
    name: "Vedneměsíčník, z. s.",
    password: "spolek",
    role: "owner",
  },
  // The following users are for testing purposes
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
