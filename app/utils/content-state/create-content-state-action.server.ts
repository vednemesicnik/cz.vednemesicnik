import { invariantResponse } from '@epic-web/invariant'
import { redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { flashAdminNotice } from '~/utils/admin-notice/flash-admin-notice.server'
import { requireCSRF } from '~/utils/csrf.server'

import type {
  ContentStateHandlers,
  PermissionTarget,
} from './create-content-state-handlers.server'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name
const PUBLISHED_AT_NAME = 'publishedAt'
// The publish dialog's date choice (design 23f); `today` is the server's now,
// so a browser clock running ahead can't make it a future date.
const PUBLISH_DATE_NAME = 'publishDate'

type SubmissionTransitionOptions = {
  id: string
  target: PermissionTarget
}

/** The submission transitions of an entity that is submitted for review (design 07d). */
export type SubmissionHandlers = {
  /** Odeslat ke schválení; `missing` lists what blocks it (23h), empty once submitted. */
  submit: (
    request: Request,
    options: SubmissionTransitionOptions,
  ) => Promise<{ missing: string[] }>
  /** Vzít zpět do konceptu (an author). */
  withdraw: (
    request: Request,
    options: SubmissionTransitionOptions,
  ) => Promise<void>
  /** Vrátit k úpravám (the Coordinator). */
  returnForEdits: (
    request: Request,
    options: SubmissionTransitionOptions,
  ) => Promise<void>
}

type RunContentStateActionOptions = {
  id: string
  handlers: ContentStateHandlers
  /** Load the permission target ({ authorIds, state }) for this row. */
  loadTarget: () => Promise<PermissionTarget>
  /** Where to redirect after a delete that requested it (row page is gone). */
  deleteRedirectTo: string
  /** A toast for that page; it must read it with `readAdminNotice`. */
  deleteNotice?: string
  /** Only the article exposes the change-published-at intent. */
  supportsChangePublishedAt?: boolean
  /** Only the article is submitted for review so far. */
  submissionHandlers?: SubmissionHandlers
}

const parsePublishedAt = (value: FormDataEntryValue | null) =>
  typeof value === 'string' && value !== '' ? new Date(value) : undefined

const parsePublishDate = (formData: FormData) =>
  formData.get(PUBLISH_DATE_NAME) === 'today'
    ? new Date()
    : parsePublishedAt(formData.get(PUBLISHED_AT_NAME))

/**
 * Shared intent-switch action for content entities: validates CSRF, loads the
 * permission target, and dispatches to the entity's {@link ContentStateHandlers}.
 * Replaces each per-entity `_index/_action.ts` switch.
 *
 * @returns `{ intent, missing }` so the page can toast or list what blocks a
 *   publish or a submission (23h); a delete that requested it redirects instead.
 */
export const runContentStateAction = async (
  request: Request,
  options: RunContentStateActionOptions,
) => {
  const { handlers, id, submissionHandlers } = options

  const formData = await request.formData()
  await requireCSRF(formData, request)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(typeof intent === 'string', 'Missing intent')

  const withRedirect = formData.get(REDIRECT_NAME) === 'true'
  const target = await options.loadTarget()

  switch (intent) {
    case INTENT_VALUE.archive:
      await handlers.archive(request, { id, target })
      return { intent, missing: [] }

    case INTENT_VALUE.delete:
      await handlers.delete(request, { id, target })

      if (withRedirect) {
        throw redirect(
          options.deleteRedirectTo,
          options.deleteNotice === undefined
            ? undefined
            : {
                headers: {
                  'Set-Cookie': await flashAdminNotice(
                    request,
                    options.deleteNotice,
                  ),
                },
              },
        )
      }
      return { intent, missing: [] }

    case INTENT_VALUE.publish: {
      const { missing } = await handlers.publish(request, {
        id,
        publishedAt: parsePublishDate(formData),
        target,
      })
      return { intent, missing }
    }

    case INTENT_VALUE.changePublishedAt: {
      if (options.supportsChangePublishedAt !== true) {
        throw new Error(`Invalid intent: ${intent}`)
      }

      const publishedAtValue = formData.get(PUBLISHED_AT_NAME)
      invariantResponse(
        typeof publishedAtValue === 'string' && publishedAtValue !== '',
        'Missing publishedAt',
      )
      await handlers.changePublishedAt(request, {
        id,
        publishedAt: new Date(publishedAtValue),
        target,
      })
      return { intent, missing: [] }
    }

    case INTENT_VALUE.restore:
      await handlers.restore(request, { id, target })
      return { intent, missing: [] }

    case INTENT_VALUE.retract:
      await handlers.retract(request, { id, target })
      return { intent, missing: [] }

    case INTENT_VALUE.review:
      await handlers.review(request, { id, target })
      return { intent, missing: [] }

    case INTENT_VALUE.submitForReview: {
      if (submissionHandlers === undefined) {
        throw new Error(`Invalid intent: ${intent}`)
      }

      const { missing } = await submissionHandlers.submit(request, {
        id,
        target,
      })
      return { intent, missing }
    }

    case INTENT_VALUE.withdrawSubmission:
      if (submissionHandlers === undefined) {
        throw new Error(`Invalid intent: ${intent}`)
      }

      await submissionHandlers.withdraw(request, { id, target })
      return { intent, missing: [] }

    case INTENT_VALUE.returnForEdits:
      if (submissionHandlers === undefined) {
        throw new Error(`Invalid intent: ${intent}`)
      }

      await submissionHandlers.returnForEdits(request, { id, target })
      return { intent, missing: [] }

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}
