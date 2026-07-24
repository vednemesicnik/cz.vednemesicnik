import { invariantResponse } from '@epic-web/invariant'
import { redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { validateCSRF } from '~/utils/csrf.server'

import type {
  ContentStateHandlers,
  PermissionTarget,
} from './create-content-state-handlers.server'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value
const REDIRECT_NAME = FORM_CONFIG.redirect.name
const PUBLISHED_AT_NAME = 'publishedAt'

type RunContentStateActionOptions = {
  id: string
  handlers: ContentStateHandlers
  /** Load the permission target ({ authorIds, state }) for this row. */
  loadTarget: () => Promise<PermissionTarget>
  /** Where to redirect after a delete that requested it (row page is gone). */
  deleteRedirectTo: string
  /** Only the article exposes the change-published-at intent. */
  supportsChangePublishedAt?: boolean
}

const parsePublishedAt = (value: FormDataEntryValue | null) =>
  typeof value === 'string' && value !== '' ? new Date(value) : undefined

/**
 * Shared intent-switch action for content entities: validates CSRF, loads the
 * permission target, and dispatches to the entity's {@link ContentStateHandlers}.
 * Replaces each per-entity `_index/_action.ts` switch.
 */
export const runContentStateAction = async (
  request: Request,
  options: RunContentStateActionOptions,
) => {
  const { handlers, id } = options

  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

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

    default:
      throw new Error(`Invalid intent: ${intent}`)
  }
}
