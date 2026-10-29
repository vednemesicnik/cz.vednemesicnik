import type {
  BulkContentAdapter,
  BulkContentRow,
} from '~/utils/bulk-action/run-bulk-content-action.server'
import { prisma } from '~/utils/db.server'

import { getTaxonomyRowActions } from '../../../utils/get-taxonomy-row-actions'
import { tagContentStateHandlers } from '../../tag/_index/utils/content-state-handlers.server'

/**
 * The tag list's bulk actions (design 25g): the tag's row actions; no edit
 * hold, and publishing takes no date and no order, since the web neither shows
 * nor sorts by a tag's publish date.
 */
export const tagBulkAdapter: BulkContentAdapter<BulkContentRow> = {
  entity: 'article_tag',
  getRowActions: (row, flags) =>
    getTaxonomyRowActions({
      ...flags,
      state: row.state,
      submission: flags.submission?.state ?? null,
    }),
  handlers: tagContentStateHandlers,
  loadRows: async (ids) => {
    const records = await prisma.articleTag.findMany({
      select: {
        author: { select: { id: true, role: { select: { level: true } } } },
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

    return records.map(({ author, ...record }) => ({
      ...record,
      authors: [author],
      hold: null,
    }))
  },
  publishDate: 'none',
}
