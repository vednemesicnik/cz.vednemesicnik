import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

import { articleContentStateHandlers } from '../../article/_index/utils/content-state-handlers.server'
import { getArticleActionFlags } from '../../utils/get-article-action-flags.server'
import type { BulkAction } from './get-bulk-actions'
import { getBulkActions } from './get-bulk-actions'
import { getOrderedPublishDates } from './get-ordered-publish-dates'
import { getRowActions } from './get-row-actions'

type Options = {
  action: BulkAction
  ids: string[]
  /** The top article's publish moment; required to publish. */
  publishBase?: Date
}

/**
 * Applies one bulk action to the selected articles, in their order (design
 * 22c). Each article is checked again as its row would be: one that changed
 * since the list was loaded — or, publishing, turned out incomplete (23h) — is
 * skipped and counted, never partly applied. Publishing gives each article
 * without a stored publish date its own moment, the top one `publishBase` and
 * each next a second earlier; one published before keeps its date (fge4es3p).
 *
 * @param request - The action's request, for the permission checks.
 * @param options - The action, the article ids in order, and the base moment.
 * @returns How many articles the action changed and how many it skipped, and
 *   whether all of them were drafts (the toast then counts koncepty).
 */
export const runBulkArticleAction = async (
  request: Request,
  { action, ids, publishBase }: Options,
) => {
  const context = await getAuthorPermissionContext(request, {
    actions: [
      'view',
      'update',
      'delete',
      'publish',
      'retract',
      'archive',
      'restore',
      'review',
    ],
    entities: ['article'],
  })
  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL

  const articles = await prisma.article.findMany({
    select: {
      authors: { select: { id: true, role: { select: { level: true } } } },
      id: true,
      publishedAt: true,
      reviews: {
        select: {
          createdAt: true,
          reviewer: { select: { id: true, role: { select: { level: true } } } },
        },
      },
      state: true,
      submittedAt: true,
    },
    where: { id: { in: ids } },
  })
  const articlesById = new Map(articles.map((article) => [article.id, article]))

  // Only articles never published take a place in the order.
  const orderedIds = ids.filter(
    (id) => articlesById.get(id)?.publishedAt === null,
  )
  const orderedDates =
    publishBase === undefined
      ? []
      : getOrderedPublishDates(publishBase, orderedIds.length)

  let processedCount = 0
  let skippedCount = 0

  // Sequential on purpose: each transition runs its own permission check and,
  // deleting, its own image cleanup.
  for (const id of ids) {
    const article = articlesById.get(id)

    if (article === undefined) {
      skippedCount += 1
      continue
    }

    const flags = getArticleActionFlags(context, article)
    const bulkActions = getBulkActions({
      ...getRowActions({
        ...flags,
        state: article.state,
        submission: flags.submission?.state ?? null,
      }),
      isApprover,
    })

    if (!bulkActions.includes(action)) {
      skippedCount += 1
      continue
    }

    const target = {
      authorIds: article.authors.map((author) => author.id),
      state: article.state,
    }

    if (action === 'publish') {
      const orderIndex = orderedIds.indexOf(id)
      const { missing } = await articleContentStateHandlers.publish(request, {
        id,
        publishedAt: orderIndex === -1 ? undefined : orderedDates[orderIndex],
        target,
      })

      if (missing.length > 0) {
        skippedCount += 1
        continue
      }
    } else if (action === 'archive') {
      await articleContentStateHandlers.archive(request, { id, target })
    } else {
      await articleContentStateHandlers.delete(request, { id, target })
    }

    processedCount += 1
  }

  return {
    onlyDrafts: articles.every((article) => article.state === 'draft'),
    processedCount,
    skippedCount,
  }
}
