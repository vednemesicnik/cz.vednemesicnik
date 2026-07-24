import { invariantResponse } from '@epic-web/invariant'

import type {
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import {
  APPROVER_ROLE_LEVEL,
  needsReviewToPublish,
} from '~/utils/permissions/author/review-policy'

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
  publish: (request: Request, options: PublishOptions) => Promise<void>
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

  const publish = (request: Request, options: PublishOptions) =>
    withAuthorPermission(request, {
      action: 'publish',
      entity,
      execute: async (context) => {
        const publishState = await config.loadPublishState(options.id)

        invariantResponse(
          !needsReviewToPublish({
            authors: publishState.authors,
            reviews: publishState.reviews,
          }),
          'Nelze publikovat bez schválení koordinátora',
        )

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

        await config.applyState(options.id, { publishedAt, state: 'published' })

        // Auto-approve when an approver publishes: their publishing act is the
        // approval, so record it once (idempotent) to satisfy the review gate
        // for lower-role co-authors and future re-publishes.
        if (context.roleLevel <= APPROVER_ROLE_LEVEL) {
          await config.ensureApprovingReview(options.id, context.authorId)
        }
      },
      target: options.target,
    })

  // Retract and restore both return to draft and wipe reviews (via applyState),
  // but keep the stored "first published" date so re-publishing preserves it.
  const retract = (request: Request, options: TransitionOptions) =>
    withAuthorPermission(request, {
      action: 'retract',
      entity,
      execute: () => config.applyState(options.id, { state: 'draft' }),
      target: options.target,
    })

  const archive = (request: Request, options: TransitionOptions) =>
    withAuthorPermission(request, {
      action: 'archive',
      entity,
      execute: () => config.applyState(options.id, { state: 'archived' }),
      target: options.target,
    })

  const restore = (request: Request, options: TransitionOptions) =>
    withAuthorPermission(request, {
      action: 'restore',
      entity,
      execute: () => config.applyState(options.id, { state: 'draft' }),
      target: options.target,
    })

  const review = (request: Request, options: TransitionOptions) =>
    withAuthorPermission(request, {
      action: 'review',
      entity,
      execute: (context) =>
        config.ensureApprovingReview(options.id, context.authorId),
      target: options.target,
    })

  const deleteRow = (request: Request, options: TransitionOptions) =>
    withAuthorPermission(request, {
      action: 'delete',
      entity,
      execute: (context) => config.deleteRow(options.id, context),
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
      execute: (context) => {
        assertCanSetPublishedAt(context, options.publishedAt)
        return config.applyState(options.id, {
          publishedAt: options.publishedAt,
        })
      },
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
