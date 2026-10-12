import { invariantResponse } from '@epic-web/invariant'
import { redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { requireCSRF } from '~/utils/csrf.server'

import type {
  ContentStateHandlers,
  PermissionTarget,
} from './create-content-state-handlers.server'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name
const PUBLISHED_AT_NAME = 'publishedAt'

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
  /** Only the article exposes the change-published-at intent. */
  supportsChangePublishedAt?: boolean
  /** Only the article is submitted for review so far. */
  submissionHandlers?: SubmissionHandlers
}

const parsePublishedAt = (value: FormDataEntryValue | null) =>
  typeof value === 'string' && value !== '' ? new Date(value) : undefined

/**
 * Shared intent-switch action for content entities: validates CSRF, loads the
 * permission target, and dispatches to the entity's {@link ContentStateHandlers}.
 * Replaces each per-entity `_index/_action.ts` switch.
 *
 * @returns For a submission intent, `{ intent, missing }` so the page can toast or
 *   list what blocks the submission; nothing for the other intents.
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
      break

    case INTENT_VALUE.delete:
      await handlers.delete(request, { id, target })

      if (withRedirect) {
        throw redirect(options.deleteRedirectTo)
      }
      break

    case INTENT_VALUE.publish:
      await handlers.publish(request, {
        id,
        publishedAt: parsePublishedAt(formData.get(PUBLISHED_AT_NAME)),
        target,
      })
      break

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
      break
    }

    case INTENT_VALUE.restore:
      await handlers.restore(request, { id, target })
      break

    case INTENT_VALUE.retract:
      await handlers.retract(request, { id, target })
      break

    case INTENT_VALUE.review:
      await handlers.review(request, { id, target })
      break

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
