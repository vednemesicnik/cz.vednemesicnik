import { invariantResponse } from '@epic-web/invariant'

import { BULK_ACTION_INTENTS } from '~/config/bulk-action-intents'
import { FORM_CONFIG } from '~/config/form-config'

import type { BulkAction } from './get-bulk-actions'

// Matches the list page size — the bar only offers selection on the current page.
const MAX_SELECTION = 20

const ACTIONS_BY_INTENT = new Map(
  Object.entries(BULK_ACTION_INTENTS).map(([action, intent]) => [
    intent,
    action as BulkAction,
  ]),
)

/**
 * Reads a list's bulk action from its form (design 22c): the intent, and the
 * selected ids trimmed, without empty values and de-duplicated before the size
 * guard, so forged `ids=` fields and repeated ids can't slip past it. The
 * order is kept: publishing follows it.
 *
 * @param formData - The submitted form.
 * @returns The bulk action and the ids, 1 to 20 of them.
 */
export const readBulkActionForm = (formData: FormData) => {
  const intent = formData.get(FORM_CONFIG.intent.name)
  invariantResponse(typeof intent === 'string', 'Missing intent')
  const action = ACTIONS_BY_INTENT.get(intent)
  invariantResponse(action !== undefined, 'Invalid intent')

  const ids = [
    ...new Set(
      formData
        .getAll('ids')
        .filter((id): id is string => typeof id === 'string')
        .map((id) => id.trim())
        .filter((id) => id !== ''),
    ),
  ]
  invariantResponse(
    ids.length > 0 && ids.length <= MAX_SELECTION,
    'Invalid selection size',
  )

  return { action, ids }
}
