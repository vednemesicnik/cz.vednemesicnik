import { getBulkActions } from '~/utils/bulk-action/get-bulk-actions'
import { createImageSources } from '~/utils/image-store/create-image-sources'
import { getIssueOrderLabel } from '~/utils/issue/get-issue-order-label'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

import { formatEditHoldLine } from '../../articles/utils/format-edit-hold-line'
import { getArticleHold } from '../../articles/utils/get-article-hold'
import { getHeldActionFlags } from '../../articles/utils/get-held-action-flags'
import { getMissingIssueContent } from '../issue/_index/utils/get-missing-issue-content'
import { getIssueFactLine } from './get-issue-fact-line'
import { getIssueRowActions } from './get-issue-row-actions'
import type { IssueRowRecord } from './issue-row-select'

type Options = {
  context: Pick<AuthorPermissionContext, 'authorId' | 'can' | 'roleLevel'>
  now: Date
  isNumberTaken: boolean
}

/**
 * An issue row of the archive, wherever the row stands (design 26a, 26e, 26i,
 * 07c): the cover, the order and the PDF, what the role may do, held back while
 * someone else edits it, with the one action on the row and the rest in „⋯“.
 *
 * @param issue - The row's columns (`ISSUE_ROW_SELECT`) with the title from
 *   `resolveIssueTitles`.
 * @param options.context - The author permission context, loaded with the
 *   actions view, update, delete, publish, retract, archive, restore and
 *   review on `issue`.
 * @param options.now - The moment of the load, which decides whether a hold
 *   has expired.
 * @param options.isNumberTaken - Another issue holds its number as published
 *   (`findTakenIssueIds`, log 0039).
 * @returns The row's actions, the bulk actions it joins, its tag state and
 *   fact, who holds it, and what publishing it lacks.
 */
export const getIssueRow = (
  issue: IssueRowRecord & { title: string },
  { context, now, isNumberTaken }: Options,
) => {
  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
  const hold = getArticleHold(issue, { authorId: context.authorId, now })
  const isHeldByOther = hold !== null && !hold.isOwn
  const unheldFlags = getContentActionFlags(context, 'issue', {
    authors: [issue.author],
    reviews: issue.reviews,
    state: issue.state,
    submittedAt: issue.submittedAt,
  })
  // While someone else edits it, its edit and state actions wait; the
  // Coordinator's Upravit opens the takeover (26i, 26k).
  const flags = getHeldActionFlags(unheldFlags, { isApprover, isHeldByOther })
  const submission = flags.submission?.state ?? null
  // Publishing an incomplete issue opens the 26e sentence instead of the
  // confirmation; only the Coordinator publishes, and the server checks again.
  const missingBeforePublish = isApprover
    ? getMissingIssueContent({
        hasCover: issue.cover !== null,
        hasPdf: issue.pdf !== null,
        isNumberTaken,
        order: issue.order,
        supplement: issue.supplement,
        year: issue.year,
      })
    : []

  return {
    ...getIssueRowActions({
      ...flags,
      canEdit: flags.canEdit || flags.canTakeOver,
      state: issue.state,
      submission,
    }),
    // What the selection bar may apply to this row (22c, 26f); a held one
    // is skipped and said apart (26i), not left out of the bar's actions.
    bulkActions: getBulkActions({
      ...getIssueRowActions({
        ...unheldFlags,
        state: issue.state,
        submission,
      }),
      isApprover,
    }),
    cover:
      issue.cover === null
        ? null
        : createImageSources('issue-cover', issue.cover),
    // The row's tag says what the detail's does (07a), with one fact (26a).
    factLine: getIssueFactLine({
      authorName: issue.author.name,
      state: issue.state,
      submission: flags.submission,
      submittedByName: issue.submittedBy?.name ?? null,
      updatedAt: issue.updatedAt,
    }),
    heldUntil: hold?.heldUntil.toISOString() ?? null,
    // Who edits it, ahead of the fact (26i, as 22f); the list looks again
    // when it should expire.
    holdLine:
      hold === null
        ? null
        : formatEditHoldLine({
            holderName: hold.heldByName,
            isOwn: hold.isOwn,
            now,
          }),
    id: issue.id,
    isHeldByOther,
    // Bulk publishing skips it and says so up front (26e, 26f).
    isIncomplete: missingBeforePublish.length > 0,
    // Publishing it, the dialog says it isn't submitted (26h).
    isNotSubmitted:
      issue.state === 'draft' &&
      flags.submission === null &&
      flags.isSubmittable &&
      !flags.isOwnContent,
    missingBeforePublish,
    orderLabel: getIssueOrderLabel(issue),
    // The name the reader downloads it under; before publish it has none,
    // so the uploaded one, as on the detail (26b, log 0039).
    pdfFileName: issue.pdf?.fileName ?? issue.pdf?.originalFileName ?? null,
    state: issue.state,
    submission,
    supplement: issue.supplement || null,
    title: issue.title,
    year: issue.year,
  }
}
