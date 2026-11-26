import { readBulkActionForm } from '~/utils/bulk-action/read-bulk-action-form'
import { runBulkContentAction } from '~/utils/bulk-action/run-bulk-content-action.server'
import { requireCSRF } from '~/utils/csrf.server'
import type { Route } from './+types/route'
import { podcastBulkAdapter } from './utils/podcast-bulk-adapter.server'

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  await requireCSRF(formData, request)

  // The ids come in the list's order: publishing spaces the podcasts by it (27a).
  const { action, ids } = readBulkActionForm(formData)

  return runBulkContentAction(request, {
    action,
    adapter: podcastBulkAdapter,
    ids,
  })
}
