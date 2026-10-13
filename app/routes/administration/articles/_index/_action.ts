import { invariantResponse } from '@epic-web/invariant'

import { FORM_CONFIG } from '~/config/form-config'
import { requireCSRF } from '~/utils/csrf.server'
import type { Route } from './+types/route'
import type { BulkAction } from './utils/get-bulk-actions'
import { runBulkArticleAction } from './utils/run-bulk-article-action.server'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

// Matches the list page size — the bar only offers selection on the current page.
const MAX_SELECTION = 20

const BULK_ACTIONS: Record<string, BulkAction> = {
  [INTENT_VALUE.bulkArchive]: 'archive',
  [INTENT_VALUE.bulkDelete]: 'delete',
  [INTENT_VALUE.bulkPublish]: 'publish',
}

// The bulk publish dialog's date choice (22c): `today` is the server's now, so
// a browser clock running ahead can't make it a future date; another day comes
// as that day at the moment of confirmation, as in 23f.
const parsePublishBase = (formData: FormData) => {
  if (formData.get('publishDate') === 'today') return new Date()

  const publishedAt = formData.get('publishedAt')
  invariantResponse(
    typeof publishedAt === 'string' && publishedAt !== '',
    'Missing publishedAt',
  )
  const base = new Date(publishedAt)
  invariantResponse(!Number.isNaN(base.getTime()), 'Invalid publishedAt')

  return base
}

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  await requireCSRF(formData, request)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(typeof intent === 'string', 'Missing intent')
  const bulkAction = BULK_ACTIONS[intent]
  invariantResponse(bulkAction !== undefined, 'Invalid intent')

  // Trim, drop empty values, and de-duplicate before the size guard so forged
  // `ids=` fields and repeated ids can't slip past validation. The order is
  // kept: publishing follows it (22c).
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

  const result = await runBulkArticleAction(request, {
    action: bulkAction,
    ids,
    publishBase:
      bulkAction === 'publish' ? parsePublishBase(formData) : undefined,
  })

  return { action: bulkAction, ...result }
}
