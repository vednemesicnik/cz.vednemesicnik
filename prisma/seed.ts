import { prisma } from '~/utils/db.server'
import { imageStore } from '~/utils/image-store/image-store.server'
import { pdfStore } from '~/utils/pdf-store/pdf-store.server'
import { authorPermissions } from '~~/data/author-permissions'
import { authorRoles } from '~~/data/author-roles'
import { userPermissions } from '~~/data/user-permissions'
import { userRoles } from '~~/data/user-roles'
import { createAuthorPermissions } from '~~/utils/create-author-permissions'
import { createAuthorRoles } from '~~/utils/create-author-roles'
import { createUserPermissions } from '~~/utils/create-user-permissions'
import { createUserRoles } from '~~/utils/create-user-roles'

import { editorialBoardMembers } from './data/editorial-board-members'
import { editorialBoardPositions } from './data/editorial-board-postions'
import { issues } from './data/issues'
import { podcastData } from './data/podcast'
import { users } from './data/users'
import { cleanupDb } from './utils/cleanup-db'
import { createEditorialBoardMembers } from './utils/create-editorial-board-members'
import { createEditorialBoardPositions } from './utils/create-editorial-board-positions'
import { createIssues } from './utils/create-issues'
import { createPodcast } from './utils/create-podcast'
import { createUsers } from './utils/create-users'

async function seed() {
  console.log('🌱 Seeding...')
  console.time(`🌱 Database has been seeded`)

  // Database cleanup 🧹
  console.time('🧹 Database has been cleaned up')
  await cleanupDb(prisma)
  console.timeEnd('🧹 Database has been cleaned up')

  // Object store cleanup 🖼️📄 (wipe the stores so fresh ids leave no orphans)
  console.time('🖼️ Image store has been cleaned up')
  await imageStore.delete([''])
  console.timeEnd('🖼️ Image store has been cleaned up')

  console.time('📄 PDF store has been cleaned up')
  await pdfStore.delete([''])
  console.timeEnd('📄 PDF store has been cleaned up')

  // Permissions 🔑
  console.time('🔑 Permissions have been created')
  await createUserPermissions(prisma, userPermissions)
  await createAuthorPermissions(prisma, authorPermissions)
  console.timeEnd('🔑 Permissions have been created')

  // Roles 👑
  console.time('👑 Roles have been created')
  await createUserRoles(prisma, userRoles)
  await createAuthorRoles(prisma, authorRoles)
  console.timeEnd('👑 Roles have been created')

  // Users 👤️
  console.time('👤️ Users have been created')
  await createUsers(prisma, users)
  console.timeEnd('👤️ Users have been created')

  // Issues 🗞️
  console.time('🗞️ Archive issues have been created')
  await createIssues(prisma, issues)
  console.timeEnd('🗞️ Archive issues have been created')

  // Editorial board member positions 🪑
  console.time('🪑 Member positions have been created')
  await createEditorialBoardPositions(prisma, editorialBoardPositions)
  console.timeEnd('🪑 Member positions have been created')

  // Editorial board members 🧑‍💼
  console.time('🧑‍💼 Editorial board members have been created')
  await createEditorialBoardMembers(prisma, editorialBoardMembers)
  console.timeEnd('🧑‍💼 Editorial board members have been created')

  // Podcast 🎙
  console.time('🎙️ Podcast has been created')
  await createPodcast(prisma, podcastData)
  console.timeEnd('🎙️ Podcast has been created')

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
