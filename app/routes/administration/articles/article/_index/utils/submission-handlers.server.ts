import { data } from 'react-router'

import type { SubmissionHandlers } from '~/utils/content-state/create-content-state-action.server'
import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { canReturnForEdits } from '~/utils/permissions/author/submission/can-return-for-edits'
import { canSubmitForReview } from '~/utils/permissions/author/submission/can-submit-for-review'
import { canWithdrawSubmission } from '~/utils/permissions/author/submission/can-withdraw-submission'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

import { getMissingArticleContent } from './get-missing-article-content'

// Taking an article back or returning it ends in an unsubmitted, unapproved
// draft (design 07b).
const clearSubmission = {
  reviews: { deleteMany: {} },
  submittedAt: null,
  submittedById: null,
}

const loadSubmissionState = (id: string) =>
  prisma.article.findUniqueOrThrow({
    select: {
      authors: { select: { id: true, role: { select: { level: true } } } },
      state: true,
      submittedAt: true,
    },
    where: { id },
  })

/**
 * Article submission transitions (design 07d): an author submits a finished draft
 * or takes it back, the Coordinator returns it for edits. The permission wrapper
 * checks the role grant; the submission rules narrow it to the article's state.
 */
export const articleSubmissionHandlers: SubmissionHandlers = {
  returnForEdits: (request, { id, target }) =>
    withAuthorPermission(request, {
      action: 'review',
      entity: 'article',
      execute: async (context) => {
        const article = await loadSubmissionState(id)

        if (
          !canReturnForEdits({
            roleLevel: context.roleLevel,
            state: article.state,
            submittedAt: article.submittedAt,
          })
        ) {
          throw data(null, { status: 403 })
        }

        await prisma.article.update({ data: clearSubmission, where: { id } })
        publishContentEvent({
          change: 'submission',
          entity: 'article',
          entityId: id,
        })
      },
      target,
    }),

  submit: (request, { id, target }) =>
    withAuthorPermission(request, {
      action: 'update',
      entity: 'article',
      execute: async (context) => {
        const article = await prisma.article.findUniqueOrThrow({
          select: {
            authors: {
              select: { id: true, role: { select: { level: true } } },
            },
            content: true,
            excerpt: true,
            images: { select: { altText: true } },
            slug: true,
            state: true,
            submittedAt: true,
            title: true,
          },
          where: { id },
        })

        if (
          !canSubmitForReview({
            authorId: context.authorId,
            authors: article.authors,
            state: article.state,
            submittedAt: article.submittedAt,
          })
        ) {
          throw data(null, { status: 403 })
        }

        const missing = getMissingArticleContent({
          authorCount: article.authors.length,
          content: article.content,
          excerpt: article.excerpt,
          images: article.images,
          slug: article.slug,
          title: article.title,
        })

        if (missing.length > 0) {
          return { missing }
        }

        // Conditional on the row still being an unsubmitted draft, so a submit
        // racing another transition can't overwrite it.
        const { count } = await prisma.article.updateMany({
          data: { submittedAt: new Date(), submittedById: context.authorId },
          where: { id, state: 'draft', submittedAt: null },
        })

        if (count === 0) {
          throw data(null, { status: 409 })
        }

        publishContentEvent({
          change: 'submission',
          entity: 'article',
          entityId: id,
        })

        return { missing }
      },
      target,
    }),

  withdraw: (request, { id, target }) =>
    withAuthorPermission(request, {
      action: 'update',
      entity: 'article',
      execute: async (context) => {
        const article = await loadSubmissionState(id)

        if (
          !canWithdrawSubmission({
            authorId: context.authorId,
            authorIds: article.authors.map((author) => author.id),
            state: article.state,
            submittedAt: article.submittedAt,
          })
        ) {
          throw data(null, { status: 403 })
        }

        await prisma.article.update({ data: clearSubmission, where: { id } })
        publishContentEvent({
          change: 'submission',
          entity: 'article',
          entityId: id,
        })
      },
      target,
    }),
}
