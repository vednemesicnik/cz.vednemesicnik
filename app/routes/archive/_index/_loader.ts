import { LIMIT_PARAM, LIMIT_STEP } from '~/config/load-more-config'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { parsePositiveIntegerParam } from '~/utils/parse-positive-integer-param'
import {
  getWebContentVisibility,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'
import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url)
  const limit = parsePositiveIntegerParam(
    url.searchParams,
    LIMIT_PARAM,
    LIMIT_STEP,
  )

  const visibility = await getWebContentVisibility(request, ['issue'])
  const visibleIssues = visibility.where('issue', ownByAuthor)

  const issuesPromise = prisma.issue.findMany({
    orderBy: {
      releasedAt: 'desc',
    },
    select: {
      cover: {
        select: imageSourceSelect,
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
    where: visibleIssues,
  })

  const issuesCountPromise = prisma.issue.count({
    where: visibleIssues,
  })

  const [issues, issuesCount] = await Promise.all([
    issuesPromise,
    issuesCountPromise,
  ])

  const issuesWithSources = issues.map((issue) => ({
    ...issue,
    cover: issue.cover
      ? {
          altText: issue.cover.altText,
          sources: createImageSources('issue-cover', issue.cover),
        }
      : null,
  }))

  return {
    issues: issuesWithSources,
    issuesCount,
    // The newest issue's cover, uncropped: a 1200×630 crop of a portrait cover
    // keeps only a band across the middle.
    ogImageUrl: issuesWithSources[0]?.cover?.sources.src ?? null,
  }
}
