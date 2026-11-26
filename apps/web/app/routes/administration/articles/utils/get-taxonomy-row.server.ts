import { getBulkActions } from '~/utils/bulk-action/get-bulk-actions'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

import { getTaxonomyFactLine } from './get-taxonomy-fact-line'
import { getTaxonomyRowActions } from './get-taxonomy-row-actions'
import type { TaxonomyRowRecord } from './taxonomy-row-select'

type Options = {
  context: Pick<AuthorPermissionContext, 'authorId' | 'can' | 'roleLevel'>
  entity: 'article_category' | 'article_tag'
  articleCount: number
}

/**
 * A category's or tag's row, wherever the row stands (design 25a, 25e, 07c):
 * what the role may do, with the one action on the row and the rest in „⋯“.
 *
 * @param record - The row's columns (`TAXONOMY_ROW_SELECT`).
 * @param options.context - The author permission context, loaded with the
 *   actions view, update, delete, publish, retract, archive, restore and
 *   review on `entity`.
 * @param options.entity - Categories or tags.
 * @param options.articleCount - Its articles in any state; deleting takes it
 *   off all of them (25d).
 * @returns The row's actions, the bulk actions it joins, its tag state and
 *   fact, and its article counts.
 */
export const getTaxonomyRow = (
  record: TaxonomyRowRecord,
  { context, entity, articleCount }: Options,
) => {
  const flags = getContentActionFlags(context, entity, {
    authors: [record.author],
    reviews: record.reviews,
    state: record.state,
    submittedAt: record.submittedAt,
  })
  const submission = flags.submission?.state ?? null
  const rowActions = getTaxonomyRowActions({
    ...flags,
    state: record.state,
    submission,
  })

  return {
    articleCount,
    // What the selection bar may apply to this row (22c, 25g).
    bulkActions: getBulkActions({
      ...rowActions,
      isApprover: context.roleLevel <= APPROVER_ROLE_LEVEL,
    }),
    // The row's tag says what the detail's does (07a), with one fact (25a).
    factLine: getTaxonomyFactLine({
      authorName: record.author.name,
      state: record.state,
      submission: flags.submission,
      submittedByName: record.submittedBy?.name ?? null,
      updatedAt: record.updatedAt,
    }),
    id: record.id,
    // Publishing it, the dialog says it isn't submitted (25g, as 22c).
    isNotSubmitted:
      record.state === 'draft' &&
      flags.submission === null &&
      flags.isSubmittable &&
      !flags.isOwnContent,
    name: record.name,
    publishedArticleCount: record._count.articles,
    slug: record.slug,
    state: submission ?? record.state,
    ...rowActions,
  }
}
