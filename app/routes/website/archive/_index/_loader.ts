import { LIMIT_PARAM } from '~/components/load-more-content'
import { getAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url)
  const limit = Number(url.searchParams.get(LIMIT_PARAM) ?? '20')

  const { isAuthenticated } = await getAuthentication(request)

  const issuesPromise = prisma.issue.findMany({
    orderBy: {
      releasedAt: 'desc',
    },
    select: {
      cover: {
        select: {
          altText: true,
          id: true,
        },
      },
      id: true,
      label: true,
      pdf: {
        select: {
          fileName: true,
          id: true,
        },
      },
    },
    take: limit,
    where: {
      state: {
        in: isAuthenticated ? ['published', 'draft'] : ['published'],
      },
    },
  })

  const issuesCountPromise = prisma.issue.count({
    where: {
      state: {
        in: isAuthenticated ? ['published', 'draft'] : ['published'],
      },
    },
  })

  const [issues, issuesCount] = await Promise.all([
    issuesPromise,
    issuesCountPromise,
  ])

  return { issues, issuesCount }
}
