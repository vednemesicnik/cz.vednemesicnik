import { invariantResponse } from '@epic-web/invariant'
import type {
  AuthorPermissionEntity,
  ContentLogEvent,
  ContentState,
} from '@generated/prisma/enums'
import { data } from 'react-router'
import { deleteContentLog } from '~/utils/content-log/delete-content-log.server'
import { formatPublishedAtChange } from '~/utils/content-log/format-published-at-change'
import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import {
  APPROVER_ROLE_LEVEL,
  canPublishWithoutReview,
  needsReviewToPublish,
} from '~/utils/permissions/author/review-policy'
import type { ContentEventChange } from '~/utils/sse/content-event'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

import { assertCanSetPublishedAt } from './assert-can-set-published-at'

type RoleLevel = { level: number }

/** Permission target every handler forwards to {@link withAuthorPermission}. */
export type PermissionTarget = {
  authorIds: string[]
  state: ContentState
}

/** Data needed to evaluate the publish review gate and preserve the publish date. */
type PublishState = {
  authors: { role: RoleLevel }[]
  reviews: { reviewer: { role: RoleLevel } }[]
  publishedAt: Date | null
  /** Tells „Schváleno a publikováno“ apart (07f) and keeps a waiting row from deletion. */
  submittedAt: Date | null
}

/**
 * The subset of columns a transition writes. Prisma ignores `undefined`, so each
 * transition passes only the fields it changes; the entity's `applyState` mirrors
 * the same object onto any dependent row (e.g. the article's PageSEO).
 */
export type StateTransitionData = {
  state?: ContentState
  publishedAt?: Date | null
}

/**
 * Adds a full review wipe to any transition that moves an entity into `draft`
 * (retract or restore), so returning to draft always requires a fresh approver
 * review before the content can be published again.
 *
 * Apply this to the entity row's own `update` only — never to the mirrored
 * PageSEO `updateMany`, which rejects nested relation writes.
 */
export const clearReviewsOnDraft = <Data extends StateTransitionData>(
  data: Data,
) => (data.state === 'draft' ? { ...data, reviews: { deleteMany: {} } } : data)

/**
 * Per-entity configuration for {@link createContentStateHandlers}. The callbacks
 * carry the entity-specific Prisma work (model, review FK, delete side effects),
 * while the factory owns the cross-cutting logic (permission wrapping, review
 * gate, approver auto-approve, publish-date resolution).
 */
export type ContentStateHandlersConfig = {
  entity: AuthorPermissionEntity
  /** Load author role levels, reviews, and the current publish date. */
  loadPublishState: (id: string) => Promise<PublishState>
  /** Write a state transition to the entity row (and any mirrored rows). */
  applyState: (id: string, data: StateTransitionData) => Promise<void>
  /** Idempotently record an approving review by `reviewerId`. */
  ensureApprovingReview: (id: string, reviewerId: string) => Promise<void>
  /** Delete the row and any entity-specific dependents (images, PDF, PageSEO). */
  deleteRow: (id: string, context: AuthorPermissionContext) => Promise<void>
  /**
   * Whether an approver may supply a backdated publish date on publish (and via
   * change-published-at). Only entities with a publish-date UI enable it. The
   * stored `publishedAt` is always preserved regardless — a "first published"
   * date that survives retract, restore, and re-publish.
   */
  allowBackdating?: boolean
  /**
   * Whether an approver may publish without a prior approving review: their
   * publishing act is the approval (recorded by the auto-approve). Content that
   * only the Coordinator publishes, where an unsubmitted or retracted draft is
   * published directly (design 07b, 07c).
   */
  approverPublishesWithoutReview?: boolean
  /**
   * What the content still lacks before it can be published (design 23h); a
   * non-empty list blocks the publish without writing. Only the article.
   */
  getMissingBeforePublish?: (id: string) => Promise<string[]>
}

type TransitionOptions = {
  id: string
  target: PermissionTarget
}

type PublishOptions = TransitionOptions & {
  publishedAt?: Date
}

type ChangePublishedAtOptions = TransitionOptions & {
  publishedAt: Date
}

export type ContentStateHandlers = {
  /** `missing` lists what blocks the publish (23h), empty once published. */
  publish: (
    request: Request,
    options: PublishOptions,
  ) => Promise<{ missing: string[] }>
  retract: (request: Request, options: TransitionOptions) => Promise<void>
  archive: (request: Request, options: TransitionOptions) => Promise<void>
  restore: (request: Request, options: TransitionOptions) => Promise<void>
  review: (request: Request, options: TransitionOptions) => Promise<void>
  delete: (request: Request, options: TransitionOptions) => Promise<void>
  changePublishedAt: (
    request: Request,
    options: ChangePublishedAtOptions,
  ) => Promise<void>
}

export const createContentStateHandlers = (
  config: ContentStateHandlersConfig,
): ContentStateHandlers => {
  const { entity } = config

  // PageSEO never runs through this factory and has no content event or history.
  const contentEntity = entity === 'page_seo' ? undefined : entity

  // Writes the step into the content's history (07f) once its write resolved.
  const recordLog = (
    id: string,
    events: ContentLogEvent[],
    context: AuthorPermissionContext,
    detail?: string,
  ) =>
    contentEntity === undefined
      ? Promise.resolve()
      : recordContentLog(
          { detail, entity: contentEntity, entityId: id, events },
          context,
        )

  // Announces a transition once its write resolved, in the actor's name; a
  // rejected one (403, invariant) announces nothing.
  const announceOnSuccess =
    <Result>(
      announcement: {
        change: ContentEventChange
        id: string
        hasChanged?: (result: Result) => boolean
      },
      execute: (context: AuthorPermissionContext) => Promise<Result>,
    ) =>
    async (context: AuthorPermissionContext) => {
      const { change, id, hasChanged = () => true } = announcement
      const result = await execute(context)

      if (contentEntity !== undefined && hasChanged(result)) {
        publishContentEvent(
          { change, entity: contentEntity, entityId: id },
          context,
        )
      }

      return result
    }

  // A publish blocked by missing content writes nothing.
  const isPublished = ({ missing }: { missing: string[] }) =>
    missing.length === 0

  const publish = (request: Request, options: PublishOptions) =>
    withAuthorPermission(request, {
      action: 'publish',
      entity,
      execute: announceOnSuccess(
        { change: 'publish', hasChanged: isPublished, id: options.id },
        async (context) => {
          const publishState = await config.loadPublishState(options.id)
          const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL

          invariantResponse(
            (config.approverPublishesWithoutReview === true && isApprover) ||
              !needsReviewToPublish({
                authors: publishState.authors,
                reviews: publishState.reviews,
              }),
            'Nelze publikovat bez schválení koordinátora',
          )

          const missing =
            (await config.getMissingBeforePublish?.(options.id)) ?? []

          if (missing.length > 0) {
            return { missing }
          }

          // Ignore any client-supplied date unless the entity allows backdating.
          const requestedPublishedAt = config.allowBackdating
            ? options.publishedAt
            : undefined

          if (requestedPublishedAt !== undefined) {
            assertCanSetPublishedAt(context, requestedPublishedAt)
          }

          // Preserve the stored "first published" date on re-publish; fall back to
          // now on the first publish (no stored date yet).
          const publishedAt =
            requestedPublishedAt ?? publishState.publishedAt ?? new Date()

          await config.applyState(options.id, {
            publishedAt,
            state: 'published',
          })

          // Auto-approve when an approver publishes: their publishing act is the
          // approval, so record it once (idempotent) to satisfy the review gate
          // for lower-role co-authors and future re-publishes.
          if (isApprover) {
            await config.ensureApprovingReview(options.id, context.authorId)
          }

          // „Schváleno a publikováno“ only when an approver publishes a submitted
          // text nobody approved yet, in one step (07f).
          const wasApproved = publishState.reviews.some((review) =>
            canPublishWithoutReview(review.reviewer.role),
          )
          const isApprovedByPublishing =
            isApprover && publishState.submittedAt != null && !wasApproved

          await recordLog(
            options.id,
            isApprovedByPublishing ? ['approve', 'publish'] : ['publish'],
            context,
          )

          return { missing }
        },
      ),
      target: options.target,
    })

  // Retract and restore both return to draft and wipe reviews (via applyState),
  // but keep the stored "first published" date so re-publishing preserves it.
  const retract = (request: Request, options: TransitionOptions) =>
    withAuthorPermission(request, {
      action: 'retract',
      entity,
      execute: announceOnSuccess(
        { change: 'retract', id: options.id },
        async (context) => {
          await config.applyState(options.id, { state: 'draft' })
          await recordLog(options.id, ['unpublish'], context)
        },
      ),
      target: options.target,
    })

  const archive = (request: Request, options: TransitionOptions) =>
    withAuthorPermission(request, {
      action: 'archive',
      entity,
      execute: announceOnSuccess(
        { change: 'archive', id: options.id },
        async (context) => {
          await config.applyState(options.id, { state: 'archived' })
          await recordLog(options.id, ['archive'], context)
        },
      ),
      target: options.target,
    })

  const restore = (request: Request, options: TransitionOptions) =>
    withAuthorPermission(request, {
      action: 'restore',
      entity,
      execute: announceOnSuccess(
        { change: 'restore', id: options.id },
        async (context) => {
          await config.applyState(options.id, { state: 'draft' })
          await recordLog(options.id, ['restore'], context)
        },
      ),
      target: options.target,
    })

  const review = (request: Request, options: TransitionOptions) =>
    withAuthorPermission(request, {
      action: 'review',
      entity,
      execute: announceOnSuccess(
        { change: 'review', id: options.id },
        async (context) => {
          await config.ensureApprovingReview(options.id, context.authorId)
          await recordLog(options.id, ['approve'], context)
        },
      ),
      target: options.target,
    })

  const deleteRow = (request: Request, options: TransitionOptions) =>
    withAuthorPermission(request, {
      action: 'delete',
      entity,
      execute: announceOnSuccess(
        { change: 'delete', id: options.id },
        async (context) => {
          // A submitted draft is not deleted (design 07c): it goes back to draft first.
          const { submittedAt } = await config.loadPublishState(options.id)

          if (submittedAt != null) {
            throw data(null, { status: 403 })
          }

          await config.deleteRow(options.id, context)

          // The history goes with its content; the deletion isn't logged (07f).
          if (contentEntity !== undefined) {
            await deleteContentLog({
              entity: contentEntity,
              entityId: options.id,
            })
          }
        },
      ),
      target: options.target,
    })

  const changePublishedAt = (
    request: Request,
    options: ChangePublishedAtOptions,
  ) =>
    withAuthorPermission(request, {
      // Closest existing grant over a published item; the level gate in
      // assertCanSetPublishedAt narrows it to approvers.
      action: 'retract',
      entity,
      execute: announceOnSuccess(
        { change: 'change-published-at', id: options.id },
        async (context) => {
          assertCanSetPublishedAt(context, options.publishedAt)

          const { publishedAt: previousPublishedAt } =
            await config.loadPublishState(options.id)

          await config.applyState(options.id, {
            publishedAt: options.publishedAt,
          })
          await recordLog(
            options.id,
            ['set_published_at'],
            context,
            formatPublishedAtChange(previousPublishedAt, options.publishedAt),
          )
        },
      ),
      target: options.target,
    })

  return {
    archive,
    changePublishedAt,
    delete: deleteRow,
    publish,
    restore,
    retract,
    review,
  }
}
