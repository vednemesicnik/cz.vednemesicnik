import type { Prisma } from '@generated/prisma/client'

import { imageSourceSelect } from '~/utils/image-store/create-image-sources'
import { issueTitleSelect } from '~/utils/issue/resolve-issue-titles.server'

/**
 * What an issue row's cover, order, state, fact and actions are read from,
 * wherever the row stands (design 26a). Its title comes from
 * `resolveIssueTitles`.
 */
export const ISSUE_ROW_SELECT = {
  author: {
    select: { id: true, name: true, role: { select: { level: true } } },
  },
  cover: { select: imageSourceSelect },
  heldByAuthor: { select: { name: true } },
  heldByAuthorId: true,
  heldByTabId: true,
  heldSince: true,
  heldUntil: true,
  id: true,
  ...issueTitleSelect,
  pdf: { select: { fileName: true, originalFileName: true } },
  reviews: {
    select: {
      createdAt: true,
      reviewer: {
        select: { id: true, role: { select: { level: true } } },
      },
    },
  },
  state: true,
  submittedAt: true,
  submittedBy: { select: { name: true } },
  supplementSlug: true,
  updatedAt: true,
} satisfies Prisma.IssueSelect

export type IssueRowRecord = Prisma.IssueGetPayload<{
  select: typeof ISSUE_ROW_SELECT
}>
