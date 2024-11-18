// noinspection TypeScriptValidateJSTypes

import { prisma } from "~/utils/db.server"
import { author } from "~~/data/author"
import { createAuthor } from "~~/utils/create-author"

import { archivedIssues } from "./data/archived-issues"
import { editorialBoardMembers } from "./data/editorial-board-members"
import { editorialBoardPositions } from "./data/editorial-board-postions"
import { permissions } from "./data/permissions"
import { podcastData } from "./data/podcast"
import { roles } from "./data/roles"
import { users } from "./data/users"
import { cleanupDb } from "./utils/cleanup-db"
import { createArchivedIssues } from "./utils/create-archived-issues"
import { createEditorialBoardMembers } from "./utils/create-editorial-board-members"
import { createEditorialBoardPositions } from "./utils/create-editorial-board-positions"
import { createPermissions } from "./utils/create-permissions"
import { createPodcast } from "./utils/create-podcast"
import { createRoles } from "./utils/create-roles"
import { createUsers } from "./utils/create-users"

async function seed() {
  console.log("🌱 Seeding...")
  console.time(`🌱 Database has been seeded`)

  // Database cleanup 🧹
  console.time("🧹 Database has been cleaned up")
  await cleanupDb(prisma)
  console.timeEnd("🧹 Database has been cleaned up")

  // Permissions 🔑
  console.time("🔑 Permissions have been created")
  await createPermissions(prisma, permissions)
  console.timeEnd("🔑 Permissions have been created")

  // Roles 👑
  console.time("👑 Roles have been created")
  await createRoles(prisma, roles)
  console.timeEnd("👑 Roles have been created")

  // Users 👤️
  console.time("👤️ Users have been created")
  await createUsers(prisma, users)
  console.timeEnd("👤️ Users have been created")

  // VDM Author 🗣️
  console.time("🗣 VDM Author has been created")
  const { id: authorId } = (await createAuthor(prisma, author)) ?? { id: "" }
  console.timeEnd("🗣 VDM Author has been created")

  // Archived issues 🗞️
  console.time("🗞️ Archive issues have been created")
  await createArchivedIssues(prisma, archivedIssues, authorId)
  console.timeEnd("🗞️ Archive issues have been created")

  // Editorial board member positions 🪪
  console.time("🪪 Member positions have been created")
  await createEditorialBoardPositions(prisma, editorialBoardPositions, authorId)
  console.timeEnd("🪪 Member positions have been created")

  // Editorial board members 👥
  console.time("👥 Editorial board members have been created")
  await createEditorialBoardMembers(prisma, editorialBoardMembers, authorId)
  console.timeEnd("👥 Editorial board members have been created")

  // Podcast 🎙
  console.time("🎙️ Podcast has been created")
  await createPodcast(prisma, podcastData, authorId)
  console.timeEnd("🎙️ Podcast has been created")

  console.timeEnd(`🌱 Database has been seeded`)
}

seed()
  .catch((error) => {
    console.error(error)
    // noinspection TypeScriptValidateJSTypes
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
