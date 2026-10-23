import type { ContentState } from '@generated/prisma/enums'
import { href } from 'react-router'

import { LIMIT_PARAM, LIMIT_STEP } from '~/config/load-more-config'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getIssuePdfFileName } from '~/utils/issue/get-issue-pdf-file-name'
import { NON_EMPTY_ISSUE_WHERE } from '~/utils/issue/non-empty-issue-where'
import {
  issueTitleSelect,
  resolveIssueTitles,
} from '~/utils/issue/resolve-issue-titles.server'
import { parsePositiveIntegerParam } from '~/utils/parse-positive-integer-param'
import {
  getWebContentVisibility,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'
import type { Route } from './+types/route'

type IssuePdfPathFields = {
  id: string
  year: number | null
  order: number | null
  supplementSlug: string
  state: ContentState
  pdf: { fileName: string | null } | null
}

// A draft's PDF has no name until publish: a previewer opens it at its
// provisional address, with the id, as only a published number is unique
// (26j, log 0039). `null` without a PDF or its address.
const getPdfPath = ({
  id,
  year,
  order,
  supplementSlug,
  state,
  pdf,
}: IssuePdfPathFields) => {
  if (pdf === null) return null

  if (state !== 'draft') {
    return pdf.fileName === null
      ? null
      : href('/archive/:fileName', { fileName: pdf.fileName })
  }

  if (year === null || order === null) return null

  const fileName = getIssuePdfFileName({ order, supplementSlug, year })
  return `${href('/archive/:fileName', { fileName })}?id=${id}`
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url)
  const limit = parsePositiveIntegerParam(
    url.searchParams,
    LIMIT_PARAM,
    LIMIT_STEP,
  )

  const visibility = await getWebContentVisibility(request, ['issue'])
  // An empty draft never shows, not even as a preview (log 0020).
  const visibleIssues = {
    AND: [visibility.where('issue', ownByAuthor), NON_EMPTY_ISSUE_WHERE],
  }

  const issuesPromise = prisma.issue.findMany({
    // A supplement stands right after its issue (design 26a).
    orderBy: [{ year: 'desc' }, { order: 'desc' }, { supplementSlug: 'asc' }],
    select: {
      ...issueTitleSelect,
      cover: {
        select: imageSourceSelect,
      },
      id: true,
      pdf: {
        select: {
          fileName: true,
          id: true,
        },
      },
      state: true,
      supplementSlug: true,
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

  const titledIssues = await resolveIssueTitles(issues, visibleIssues)

  const issuesWithSources = titledIssues.map(
    ({ pdf, state, supplementSlug, ...issue }) => ({
      ...issue,
      cover: issue.cover
        ? {
            altText: issue.cover.altText,
            sources: createImageSources('issue-cover', issue.cover),
          }
        : null,
      pdfPath: getPdfPath({ ...issue, pdf, state, supplementSlug }),
    }),
  )

  return { issues: issuesWithSources, issuesCount }
}
