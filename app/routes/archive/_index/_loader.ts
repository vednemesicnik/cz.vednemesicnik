import type { ContentState } from '@generated/prisma/enums'
import { href } from 'react-router'

import { getListPreview } from '~/utils/content-preview/get-list-preview'
import { getWebPreviewState } from '~/utils/content-preview/get-web-preview-state'
import { WEB_PREVIEW_STATE_SELECT } from '~/utils/content-preview/web-preview-state-select'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getIssueLinkLabel } from '~/utils/issue/get-issue-link-label'
import { getIssuePdfFileName } from '~/utils/issue/get-issue-pdf-file-name'
import { getIssueTileLabels } from '~/utils/issue/get-issue-tile-labels'
import { issueTitleSelect } from '~/utils/issue/issue-title-select'
import { loadMainIssueNames } from '~/utils/issue/load-main-issue-names.server'
import { NON_EMPTY_ISSUE_WHERE } from '~/utils/issue/non-empty-issue-where'
import {
  getWebContentVisibility,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'
import type { Route } from './+types/route'
import { groupIssuesByYear } from './utils/group-issues-by-year'

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
  const visibility = await getWebContentVisibility(request, ['issue'])
  // An empty draft never shows, not even as a preview (log 0020).
  const visibleIssues = {
    AND: [
      visibility.where('issue', ownByAuthor, ['draft', 'archived']),
      NON_EMPTY_ISSUE_WHERE,
    ],
  }

  // Every issue on one page; the year row handles the length (14a, fr24hvgc).
  const issues = await prisma.issue.findMany({
    // A supplement stands right after its issue (design 26a).
    orderBy: [{ year: 'desc' }, { order: 'desc' }, { supplementSlug: 'asc' }],
    select: {
      ...WEB_PREVIEW_STATE_SELECT,
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
      supplementSlug: true,
    },
    where: visibleIssues,
  })

  const mainIssueNames = await loadMainIssueNames(issues, visibleIssues)

  // A tile without its PDF has nowhere to lead; one without a cover shows the
  // gradient instead (14c).
  const tiles = issues.flatMap(
    ({ cover, year, order, reviews, submittedAt, ...issue }) => {
      const pdfPath = getPdfPath({ ...issue, order, year })
      if (pdfPath === null || year === null || order === null) return []

      const numberedIssue = { ...issue, order, year }
      const mainIssueName = issue.supplement
        ? (mainIssueNames.get(`${year}/${order}`) ?? null)
        : null

      return [
        {
          ...getIssueTileLabels(numberedIssue, mainIssueName),
          cover: cover
            ? {
                altText: cover.altText,
                sources: createImageSources('issue-cover', cover),
              }
            : null,
          id: issue.id,
          linkLabel: getIssueLinkLabel(numberedIssue, mainIssueName),
          pdfPath,
          previewState: getWebPreviewState({
            reviews,
            state: issue.state,
            submittedAt,
          }),
          year,
        },
      ]
    },
  )

  return { preview: getListPreview(tiles), years: groupIssuesByYear(tiles) }
}
