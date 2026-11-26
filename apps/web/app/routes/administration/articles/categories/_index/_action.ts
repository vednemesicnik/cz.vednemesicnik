import { readBulkActionForm } from '~/utils/bulk-action/read-bulk-action-form'
import { runBulkContentAction } from '~/utils/bulk-action/run-bulk-content-action.server'
import { requireCSRF } from '~/utils/csrf.server'
import type { Route } from './+types/route'
import { categoryBulkAdapter } from './utils/category-bulk-adapter.server'

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  await requireCSRF(formData, request)

  const { action, ids } = readBulkActionForm(formData)

  return runBulkContentAction(request, {
    action,
    adapter: categoryBulkAdapter,
    ids,
  })
}
