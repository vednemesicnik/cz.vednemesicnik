import type { ContentState } from '@generated/prisma/enums'

import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import {
  APPROVER_ROLE_LEVEL,
  canPublishWithoutReview,
  needsReviewToPublish,
} from '~/utils/permissions/author/review-policy'
import { canReturnForEdits } from '~/utils/permissions/author/submission/can-return-for-edits'
import { canSubmitForReview } from '~/utils/permissions/author/submission/can-submit-for-review'
import { canWithdrawSubmission } from '~/utils/permissions/author/submission/can-withdraw-submission'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'

type RoleLevel = { level: number }

type Article = {
  state: ContentState
  submittedAt: Date | null
  authors: { id: string; role: RoleLevel }[]
  reviews: { createdAt: Date; reviewer: { id: string; role: RoleLevel } }[]
}

type Context = Pick<AuthorPermissionContext, 'authorId' | 'can' | 'roleLevel'>

/**
 * What the signed-in author may do with an article, for its detail's header and
 * its list row alike (design 07c, 07d).
 *
 * @param context - The author permission context, loaded with the actions view,
 *   update, delete, publish, retract, archive, restore and review on `article`.
 * @param article - The article's state, submission, authors and reviews.
 * @returns One flag per action, `isOwnContent`, `isSubmittable` (no Coordinator
 *   among the authors), and the draft's `submission`: `pending` since it was
 *   submitted, or `approved` since the approving review; `null` otherwise.
 */
export const getArticleActionFlags = (context: Context, article: Article) => {
  const targetAuthorIds = article.authors.map((author) => author.id)

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
      entity: 'article',
      state: article.state,
      targetAuthorIds,
    }).hasPermission

  // The Coordinator publishes an article directly, even one nobody submitted or
  // one retracted from the web: publishing is the approval (design 07b, 07c).
  const needsReview =
    context.roleLevel > APPROVER_ROLE_LEVEL &&
    needsReviewToPublish({
      authors: article.authors,
      reviews: article.reviews,
    })

  const isOwnContent = targetAuthorIds.includes(context.authorId)
  // Submission (design 07a, 07d): a submitted draft waits, and with an approving
  // review it is approved. Its authors can't edit or delete it meanwhile.
  const isSubmitted = article.submittedAt !== null
  const approvingReview = article.reviews.find((review) =>
    canPublishWithoutReview(review.reviewer.role),
  )

  // Don't offer approval if every author publishes without review, if it is
  // one's own content, or if the article isn't waiting: approval reads a
  // submitted text, once (design 07c).
  const canApprove =
    can('review') &&
    !article.authors.every((author) => canPublishWithoutReview(author.role)) &&
    !isOwnContent &&
    isSubmitted &&
    approvingReview === undefined &&
    !article.reviews.some((review) => review.reviewer.id === context.authorId)

  const submission =
    article.state !== 'draft' || article.submittedAt === null
      ? null
      : approvingReview === undefined
        ? { date: article.submittedAt, state: 'pending' as const }
        : { date: approvingReview.createdAt, state: 'approved' as const }

  return {
    canApprove,
    canArchive: can('archive'),
    canChangePublishedAt:
      article.state === 'published' && context.roleLevel <= APPROVER_ROLE_LEVEL,
    canDelete: can('delete') && !isSubmitted,
    canEdit:
      can('update') &&
      !isLockedBySubmission({
        roleLevel: context.roleLevel,
        submittedAt: article.submittedAt,
      }),
    canPublish: can('publish') && !needsReview,
    canRestore: can('restore'),
    canRetract: can('retract'),
    canReturn:
      can('review') &&
      canReturnForEdits({
        roleLevel: context.roleLevel,
        state: article.state,
        submittedAt: article.submittedAt,
      }),
    canSubmit:
      can('update') &&
      canSubmitForReview({
        authorId: context.authorId,
        authors: article.authors,
        state: article.state,
        submittedAt: article.submittedAt,
      }),
    canWithdraw: canWithdrawSubmission({
      authorId: context.authorId,
      authorIds: targetAuthorIds,
      state: article.state,
      submittedAt: article.submittedAt,
    }),
    isOwnContent,
    // As canSubmitForReview: with a Coordinator among the authors, nobody submits it.
    isSubmittable: article.authors.every(
      (author) => !canPublishWithoutReview(author.role),
    ),
    submission,
  }
}

export type ArticleActionFlags = ReturnType<typeof getArticleActionFlags>
