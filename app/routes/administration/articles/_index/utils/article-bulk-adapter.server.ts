import type {
  BulkContentAdapter,
  BulkContentRow,
} from '~/utils/bulk-action/run-bulk-content-action.server'
import { prisma } from '~/utils/db.server'

import { articleContentStateHandlers } from '../../article/_index/utils/content-state-handlers.server'
import { getRowActions } from '../../utils/get-row-actions'

/**
 * The article list's bulk actions (design 22c): the article's row actions, its
 * edit hold, and the publish dialog's chosen day, spaced in the dialog's order.
 */
export const articleBulkAdapter: BulkContentAdapter<BulkContentRow> = {
  entity: 'article',
  getRowActions: (row, flags) =>
    getRowActions({
      ...flags,
      state: row.state,
      submission: flags.submission?.state ?? null,
    }),
  handlers: articleContentStateHandlers,
  loadRows: async (ids) => {
    const articles = await prisma.article.findMany({
      select: {
        authors: { select: { id: true, role: { select: { level: true } } } },
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

    return articles.map(
      ({ heldByAuthorId, heldByTabId, heldSince, heldUntil, ...article }) => ({
        ...article,
        hold: { heldByAuthorId, heldByTabId, heldSince, heldUntil },
      }),
    )
  },
  publishDate: 'chosen',
}
