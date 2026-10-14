import type { ContentLogEntity, ContentState } from '@generated/prisma/enums'

import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import {
  APPROVER_ROLE_LEVEL,
  canPublishWithoutReview,
  needsReviewToPublish,
} from '~/utils/permissions/author/review-policy'
import { canReturnForEdits } from '~/utils/permissions/author/submission/can-return-for-edits'
import { canSubmitForReview } from '~/utils/permissions/author/submission/can-submit-for-review'
import { canWithdrawSubmission } from '~/utils/permissions/author/submission/can-withdraw-submission'
import { getSubmissionState } from '~/utils/permissions/author/submission/get-submission-state'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'

type RoleLevel = { level: number }

type Content = {
  state: ContentState
  submittedAt: Date | null
  authors: { id: string; role: RoleLevel }[]
  reviews: { createdAt: Date; reviewer: { id: string; role: RoleLevel } }[]
}

type Context = Pick<AuthorPermissionContext, 'authorId' | 'can' | 'roleLevel'>

/**
 * What the signed-in author may do with a piece of content, for its detail's
 * header and its list row alike (design 07c, 07d).
 *
 * @param context - The author permission context, loaded with the actions view,
 *   update, delete, publish, retract, archive, restore and review on `entity`.
 * @param entity - The content's entity.
 * @param content - Its state, submission, authors (one for all but the article)
 *   and reviews.
 * @returns One flag per action, `isOwnContent`, `isSubmittable` (no Coordinator
 *   among the authors), and the draft's `submission`: `pending` since it was
 *   submitted, or `approved` since the approving review; `null` otherwise.
 */
export const getContentActionFlags = (
  context: Context,
  entity: ContentLogEntity,
  content: Content,
) => {
  const targetAuthorIds = content.authors.map((author) => author.id)

  const can = (
    action:
      | 'update'
      | 'delete'
      | 'publish'
      | 'retract'
      | 'archive'
      | 'restore'
      | 'review',
  ) =>
    context.can({
      action,
      entity,
      state: content.state,
      targetAuthorIds,
    }).hasPermission

  // The Coordinator publishes content directly, even one nobody submitted or
  // one retracted from the web: publishing is the approval (design 07b, 07c).
  const needsReview =
    context.roleLevel > APPROVER_ROLE_LEVEL &&
    needsReviewToPublish({
      authors: content.authors,
      reviews: content.reviews,
    })

  const isOwnContent = targetAuthorIds.includes(context.authorId)
  // Submission (design 07a, 07d): a submitted draft waits, and with an approving
  // review it is approved. Its authors can't edit or delete it meanwhile.
  const isSubmitted = content.submittedAt !== null
  const approvingReview = content.reviews.find((review) =>
    canPublishWithoutReview(review.reviewer.role),
  )

  // Don't offer approval if every author publishes without review, if it is
  // one's own content, or if it isn't waiting: approval reads a
  // submitted text, once (design 07c).
  const canApprove =
    can('review') &&
    !content.authors.every((author) => canPublishWithoutReview(author.role)) &&
    !isOwnContent &&
    isSubmitted &&
    approvingReview === undefined &&
    !content.reviews.some((review) => review.reviewer.id === context.authorId)

  const submission = getSubmissionState(content)

  return {
    canApprove,
    canArchive: can('archive'),
    canChangePublishedAt:
      content.state === 'published' && context.roleLevel <= APPROVER_ROLE_LEVEL,
    canDelete: can('delete') && !isSubmitted,
    canEdit:
      can('update') &&
      !isLockedBySubmission({
        roleLevel: context.roleLevel,
        submittedAt: content.submittedAt,
      }),
    canPublish: can('publish') && !needsReview,
    canRestore: can('restore'),
    canRetract: can('retract'),
    canReturn:
      can('review') &&
      canReturnForEdits({
        roleLevel: context.roleLevel,
        state: content.state,
        submittedAt: content.submittedAt,
      }),
    canSubmit:
      can('update') &&
      canSubmitForReview({
        authorId: context.authorId,
        authors: content.authors,
        state: content.state,
        submittedAt: content.submittedAt,
      }),
    canWithdraw: canWithdrawSubmission({
      authorId: context.authorId,
      authorIds: targetAuthorIds,
      state: content.state,
      submittedAt: content.submittedAt,
    }),
    isOwnContent,
    // As canSubmitForReview: with a Coordinator among the authors, nobody submits it.
    isSubmittable: content.authors.every(
      (author) => !canPublishWithoutReview(author.role),
    ),
    submission,
  }
}

export type ContentActionFlags = ReturnType<typeof getContentActionFlags>
