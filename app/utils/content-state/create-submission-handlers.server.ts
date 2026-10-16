import type { ContentLogEntity, ContentState } from '@generated/prisma/enums'
import { data } from 'react-router'
import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { canReturnForEdits } from '~/utils/permissions/author/submission/can-return-for-edits'
import { canSubmitForReview } from '~/utils/permissions/author/submission/can-submit-for-review'
import { canWithdrawSubmission } from '~/utils/permissions/author/submission/can-withdraw-submission'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

import type { SubmissionHandlers } from './create-content-state-action.server'

type SubmissionState = {
  authors: { id: string; role: { level: number } }[]
  state: ContentState
  submittedAt: Date | null
}

type SubmissionHandlersConfig = {
  entity: ContentLogEntity
  loadSubmissionState: (id: string) => Promise<SubmissionState>
  markSubmitted: (id: string, authorId: string) => Promise<number>
  clearSubmission: (id: string, authorId: string) => Promise<void>
  getMissing?: (id: string) => Promise<string[]>
}

/**
 * Builds the submission transitions of a content entity (design 07d): an author
 * submits a finished draft or takes it back, the Coordinator returns it for edits.
 * The permission wrapper checks the role grant; the submission rules narrow it to
 * the content's state.
 *
 * @param config.loadSubmissionState - The content's authors, state and submission.
 * @param config.markSubmitted - Records the submission only while the row is still
 *   an unsubmitted draft, so a submit racing another transition can't overwrite
 *   it; resolves to the number of rows written. An entity with an edit hold
 *   repeats "not held by someone else than `authorId`" in that write and throws
 *   the held refusal when it fails (decision 0019).
 * @param config.clearSubmission - Ends the submission and deletes the reviews: a
 *   taken back or returned draft is unsubmitted and unapproved (design 07b).
 *   Held content is refused as in `markSubmitted`.
 * @param config.getMissing - What the content still lacks before it can be
 *   submitted (design 23h); none when omitted.
 */
export const createSubmissionHandlers = (
  config: SubmissionHandlersConfig,
): SubmissionHandlers => {
  const { entity } = config

  // Writes the step into the history (07f), then tells the other sessions.
  const announce = async (
    id: string,
    event: 'submit' | 'withdraw' | 'return',
    context: AuthorPermissionContext,
  ) => {
    await recordContentLog({ entity, entityId: id, events: [event] }, context)
    publishContentEvent({ change: 'submission', entity, entityId: id }, context)
  }

  return {
    returnForEdits: (request, { id, target }) =>
      withAuthorPermission(request, {
        action: 'review',
        entity,
        execute: async (context) => {
          const content = await config.loadSubmissionState(id)

          if (
            !canReturnForEdits({
              roleLevel: context.roleLevel,
              state: content.state,
              submittedAt: content.submittedAt,
            })
          ) {
            throw data(null, { status: 403 })
          }

          await config.clearSubmission(id, context.authorId)
          await announce(id, 'return', context)
        },
        target,
      }),

    submit: (request, { id, target }) =>
      withAuthorPermission(request, {
        action: 'update',
        entity,
        execute: async (context) => {
          const content = await config.loadSubmissionState(id)

          if (
            !canSubmitForReview({
              authorId: context.authorId,
              authors: content.authors,
              state: content.state,
              submittedAt: content.submittedAt,
            })
          ) {
            throw data(null, { status: 403 })
          }

          const missing = (await config.getMissing?.(id)) ?? []

          if (missing.length > 0) {
            return { missing }
          }

          const count = await config.markSubmitted(id, context.authorId)

          if (count === 0) {
            throw data(null, { status: 409 })
          }

          await announce(id, 'submit', context)

          return { missing }
        },
        target,
      }),

    withdraw: (request, { id, target }) =>
      withAuthorPermission(request, {
        action: 'update',
        entity,
        execute: async (context) => {
          const content = await config.loadSubmissionState(id)

          if (
            !canWithdrawSubmission({
              authorId: context.authorId,
              authorIds: content.authors.map((author) => author.id),
              state: content.state,
              submittedAt: content.submittedAt,
            })
          ) {
            throw data(null, { status: 403 })
          }

          await config.clearSubmission(id, context.authorId)
          await announce(id, 'withdraw', context)
        },
        target,
      }),
  }
}
