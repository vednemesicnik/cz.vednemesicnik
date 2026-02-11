import { prisma } from '~/utils/db.server'
import { authorPermissions } from '~~/data/author-permissions'
import { authorRoles } from '~~/data/author-roles'
import { pagesSEOData } from '~~/data/pages-seo'
import { podcastsData } from '~~/data/podcasts/data'
import { podcastEpisodesData } from '~~/data/podcasts/episodes/data'
import { podcastEpisodeLinksData } from '~~/data/podcasts/episodes/links/data'
import { userPermissions } from '~~/data/user-permissions'
import { userRoles } from '~~/data/user-roles'
import { createAuthorPermissions } from '~~/utils/create-author-permissions'
import { createAuthorRoles } from '~~/utils/create-author-roles'
import { createPagesSeoData } from '~~/utils/create-pages-seo'
import { createPodcastEpisodeLinks } from '~~/utils/create-podcast-episode-links'
import { createPodcastEpisodes } from '~~/utils/create-podcast-episodes'
import { createUserPermissions } from '~~/utils/create-user-permissions'
import { createUserRoles } from '~~/utils/create-user-roles'
import { editorialBoardMembers } from './data/editorial-board-members'
import { editorialBoardPositions } from './data/editorial-board-postions'
import { issues } from './data/issues'
import { usersData } from './data/users'
import { cleanupDb } from './utils/cleanup-db'
import { createEditorialBoardMembers } from './utils/create-editorial-board-members'
import { createEditorialBoardPositions } from './utils/create-editorial-board-positions'
import { createIssues } from './utils/create-issues'
import { createPodcasts } from './utils/create-podcasts'
import { createUsers } from './utils/create-users'

async function seed() {
  console.log('🌱 Seeding...')
  console.time(`🌱 Database has been seeded`)

  // Database cleanup 🧹
  console.time('🧹 Database has been cleaned up')
  await cleanupDb(prisma)
  console.timeEnd('🧹 Database has been cleaned up')

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
  const users = await createUsers(prisma, usersData)
  console.timeEnd('👤️ Users have been created')

  // Get Vednemesicnik author ID
  const vednemesicnikUserIndex = usersData.findIndex(
    (userData) => userData.name === 'Vedneměsíčník, z. s.',
  )
  const vednemesicnikAuthorId = users[vednemesicnikUserIndex].authorId

  // Issues 🗞️
  console.time('🗞️ Archive issues have been created')
  await createIssues(prisma, issues, vednemesicnikAuthorId)
  console.timeEnd('🗞️ Archive issues have been created')

  // Editorial board member positions 🪑
  console.time('🪑 Member positions have been created')
  await createEditorialBoardPositions(
    prisma,
    editorialBoardPositions,
    vednemesicnikAuthorId,
  )
  console.timeEnd('🪑 Member positions have been created')

  // Editorial board members 🧑‍💼
  console.time('🧑‍💼 Editorial board members have been created')
  await createEditorialBoardMembers(
    prisma,
    editorialBoardMembers,
    vednemesicnikAuthorId,
  )
  console.timeEnd('🧑‍💼 Editorial board members have been created')

  // Podcasts 🎙
  console.time('🎙️ Podcasts has been created')
  await createPodcasts(prisma, podcastsData, vednemesicnikAuthorId)
  console.timeEnd('🎙️ Podcasts has been created')

  // Podcast episodes 🎧
  console.time('🎧 Podcast episodes have been created')
  await createPodcastEpisodes(
    prisma,
    podcastEpisodesData,
    vednemesicnikAuthorId,
  )
  console.timeEnd('🎧 Podcast episodes have been created')

  // Podcast episode links 🔗
  console.time('🔗 Podcast episode links have been created')
  await createPodcastEpisodeLinks(
    prisma,
    podcastEpisodeLinksData,
    vednemesicnikAuthorId,
  )
  console.timeEnd('🔗 Podcast episode links have been created')

  // Pages SEO 📄
  console.time('📄 Pages SEO have been created')
  await createPagesSeoData(prisma, pagesSEOData, vednemesicnikAuthorId)
  console.timeEnd('📄 Pages SEO have been created')

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
