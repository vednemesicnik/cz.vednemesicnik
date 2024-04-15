// noinspection TypeScriptValidateJSTypes

import { prisma } from "~/utils/db.server"

// DB seed utils
import { cleanupDb } from "./utils/cleanup-db"
import { createArchivedIssues } from "./utils/create-archived-issues"
import { createEditorialBoardMemberPositions } from "./utils/create-editorial-board-member-positions"
import { createEditorialBoardMembers } from "./utils/create-editorial-board-members"
import { createPermissions } from "./utils/create-permissions"
import { createPodcast } from "./utils/create-podcast"
import { createRoles } from "./utils/create-roles"
import { createUsers } from "./utils/create-users"

// DB seed data
import { archivedIssues } from "./data/archived-issues"
import { editorialBoardMemberPositions } from "./data/editorial-board-member-postions"
import { editorialBoardMembers } from "./data/editorial-board-members"
import { permissions } from "./data/permissions"
import { podcastData } from "./data/podcast"
import { roles } from "./data/roles"
import { users } from "./data/users"

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

  // Archived issues 🗞️
  console.time("🗞️ Archive issues have been created")
  await createArchivedIssues(prisma, archivedIssues)
  console.timeEnd("🗞️ Archive issues have been created")

  // Editorial board member positions 🪪
  console.time("🪪 Member positions have been created")
  await createEditorialBoardMemberPositions(prisma, editorialBoardMemberPositions)
  console.timeEnd("🪪 Member positions have been created")

  // Editorial board members 👥
  console.time("👥 Editorial board members have been created")
  await createEditorialBoardMembers(prisma, editorialBoardMembers)
  console.timeEnd("👥 Editorial board members have been created")

  // Podcast 🎙
  console.time("🎙️ Podcast has been created")
  await createPodcast(prisma, podcastData)
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
