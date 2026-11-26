import { invariantResponse } from '@epic-web/invariant'

import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { FORM_CONFIG } from '~/config/form-config'
import { requireCSRF } from '~/utils/csrf.server'

import type { Route } from './+types/route'
import { articleEditHoldHandlers } from './utils/article-edit-hold-handlers.server'

const INTENT_VALUE = FORM_CONFIG.intent.value

/**
 * Takes, renews, releases or takes over the article's edit hold for one tab of
 * the editor. A POST to a resource route runs only this action, so it requires
 * the session itself (`requireCSRF` does, before the token). Answers JSON
 * for the editor's `fetch`.
 */
export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData()
  await requireCSRF(formData, request)

  const intent = formData.get(FORM_CONFIG.intent.name)
  const tabId = formData.get(EDIT_HOLD_CONFIG.tabIdName)
  invariantResponse(
    typeof tabId === 'string' && tabId !== '',
    'Missing editTabId',
  )

  return Response.json(
    await runEditHoldIntent(request, intent, {
      expectedUpdatedAt: formData.get(EDIT_HOLD_CONFIG.expectedUpdatedAtName),
      id: params.articleId,
      keepEmpty: formData.get(EDIT_HOLD_CONFIG.keepEmptyName) === 'true',
      tabId,
    }),
  )
}

const runEditHoldIntent = (
  request: Request,
  intent: FormDataEntryValue | null,
  {
    expectedUpdatedAt,
    keepEmpty,
    ...options
  }: {
    id: string
    tabId: string
    expectedUpdatedAt: FormDataEntryValue | null
    keepEmpty: boolean
  },
) => {
  // The editor's own last save: it takes the hold only over that (24i).
  const takeOptions = {
    ...options,
    expectedUpdatedAt:
      typeof expectedUpdatedAt === 'string' && expectedUpdatedAt !== ''
        ? new Date(expectedUpdatedAt)
        : undefined,
  }

  switch (intent) {
    case INTENT_VALUE.takeEditHold:
      return articleEditHoldHandlers.take(request, takeOptions)
    case INTENT_VALUE.renewEditHold:
      return articleEditHoldHandlers.renew(request, options)
    case INTENT_VALUE.releaseEditHold:
      return articleEditHoldHandlers.release(request, {
        ...options,
        keepEmpty,
      })
    case INTENT_VALUE.takeOverEditHold:
      return articleEditHoldHandlers.takeOver(request, takeOptions)
    default:
      throw new Response(null, { status: 400 })
  }
}
