import type {
  BulkContentAdapter,
  BulkContentRow,
} from '~/utils/bulk-action/run-bulk-content-action.server'
import { prisma } from '~/utils/db.server'

import { issueContentStateHandlers } from '../../issue/_index/utils/content-state-handlers.server'
import { getIssueRowActions } from '../../utils/get-issue-row-actions'

/**
 * The archive's bulk actions (design 26f): the issue's row actions and its
 * edit hold. Publishing takes no date and no order: the archive on the web
 * orders by year and order (log 0031).
 */
export const issueBulkAdapter: BulkContentAdapter<BulkContentRow> = {
  entity: 'issue',
  getRowActions: (row, flags) =>
    getIssueRowActions({
      ...flags,
      state: row.state,
      submission: flags.submission?.state ?? null,
    }),
  handlers: issueContentStateHandlers,
  loadRows: async (ids) => {
    const issues = await prisma.issue.findMany({
      select: {
        author: { select: { id: true, role: { select: { level: true } } } },
        heldByAuthorId: true,
        heldByTabId: true,
        heldSince: true,
        heldUntil: true,
        id: true,
        publishedAt: true,
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
      },
      where: { id: { in: ids } },
    })

    return issues.map(
      ({
        author,
        heldByAuthorId,
        heldByTabId,
        heldSince,
        heldUntil,
        ...issue
      }) => ({
        ...issue,
        authors: [author],
        hold: { heldByAuthorId, heldByTabId, heldSince, heldUntil },
      }),
    )
  },
  publishDate: 'none',
}
