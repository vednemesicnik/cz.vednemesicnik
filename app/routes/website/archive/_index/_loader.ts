import { type LoaderFunctionArgs, redirect } from 'react-router'

import { LIMIT_PARAM } from '~/components/load-more-content'
import { getAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const limit = url.searchParams.get(LIMIT_PARAM)

  if (!limit) {
    url.searchParams.set(LIMIT_PARAM, '20')
    throw redirect(url.toString(), { status: 301 })
  }

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
    take: Number(limit),
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
