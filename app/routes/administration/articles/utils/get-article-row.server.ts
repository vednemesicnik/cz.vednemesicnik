import { getBulkActions } from '~/utils/bulk-action/get-bulk-actions'
import { formatNumericDate } from '~/utils/format-numeric-date'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

import type { ArticleRowRecord } from './article-row-select'
import { formatEditHoldLine } from './format-edit-hold-line'
import { getArticleDisplayTitle } from './get-article-display-title'
import { getArticleFactLine } from './get-article-fact-line'
import { getArticleHold } from './get-article-hold'
import { getHeldActionFlags } from './get-held-action-flags'
import { getRowActions } from './get-row-actions'

type Options = {
  context: Pick<AuthorPermissionContext, 'authorId' | 'can' | 'roleLevel'>
  now: Date
}

/**
 * An article row's state, fact and actions, wherever the row stands (design
 * 22a, 22b, 22f, 07c): what the role may do, held back while someone else
 * edits it, with the one action on the row and the rest in „⋯“.
 *
 * @param article - The row's columns (`ARTICLE_ROW_SELECT`).
 * @param options.context - The author permission context, loaded with the
 *   actions view, update, delete, publish, retract, archive, restore and
 *   review on `article`.
 * @param options.now - The moment of the load, which decides „dnes“ and
 *   whether a hold has expired.
 * @returns The row's actions, the bulk actions it joins, its tag state and
 *   fact, who holds it, and what its dialogs say.
 */
export const getArticleRow = (
  article: ArticleRowRecord,
  { context, now }: Options,
) => {
  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
  const unheldFlags = getContentActionFlags(context, 'article', article)
  const hold = getArticleHold(article, { authorId: context.authorId, now })
  const isHeldByOther = hold !== null && !hold.isOwn
  // While someone else edits it, its edit and state actions wait (07g); the
  // Coordinator's Upravit opens the takeover (22f, 24g).
  const flags = getHeldActionFlags(unheldFlags, { isApprover, isHeldByOther })
  const submission = flags.submission?.state ?? null

  return {
    ...getRowActions({
      ...flags,
      canEdit: flags.canEdit || flags.canTakeOver,
      state: article.state,
      submission,
    }),
    authorNames: article.authors.map((author) => author.name),
    // What the selection bar may apply to this row (22c); a held one is
    // skipped and said apart (22f), not left out of the bar's actions.
    bulkActions: getBulkActions({
      ...getRowActions({ ...unheldFlags, state: article.state, submission }),
      isApprover,
    }),
    factLine: getArticleFactLine({
      now,
      publishedAt: article.publishedAt,
      state: article.state,
      submission: flags.submission,
      updatedAt: article.updatedAt,
    }),
    heldUntil: hold?.heldUntil.toISOString() ?? null,
    // Who edits it, ahead of the fact and of a live change (22f, 2txmjnaq);
    // the list looks again when it should expire.
    holdLine:
      hold === null
        ? null
        : formatEditHoldLine({
            holderName: hold.heldByName,
            isOwn: hold.isOwn,
            now,
          }),
    id: article.id,
    isHeldByOther,
    // Publishing it, the dialog says it isn't submitted (23f).
    isNotSubmitted:
      article.state === 'draft' &&
      flags.submission === null &&
      flags.isSubmittable &&
      !flags.isOwnContent,
    // A draft without a title goes by its name, said quieter (22f).
    isUntitled: article.title.trim() === '',
    publishedAt: article.publishedAt?.toISOString() ?? null,
    slug: article.slug,
    state: flags.submission?.state ?? article.state,
    title: getArticleDisplayTitle(article.title),
    updatedAt: formatNumericDate(article.updatedAt),
  }
}
