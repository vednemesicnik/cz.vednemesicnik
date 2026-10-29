import { invariantResponse } from '@epic-web/invariant'

import { readBulkActionForm } from '~/utils/bulk-action/read-bulk-action-form'
import { readBulkPublishBase } from '~/utils/bulk-action/read-bulk-publish-base'
import { runBulkContentAction } from '~/utils/bulk-action/run-bulk-content-action.server'
import { requireCSRF } from '~/utils/csrf.server'
import type { Route } from './+types/route'
import { createEpisodeBulkAdapter } from './utils/create-episode-bulk-adapter.server'

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { podcastId } = params
  // Guard the scope key: a missing podcastId would make Prisma drop the filter
  // and let the action reach episodes across all podcasts.
  invariantResponse(podcastId, 'Missing podcast id')

  const formData = await request.formData()
  await requireCSRF(formData, request)

  const { action, ids } = readBulkActionForm(formData)

  return runBulkContentAction(request, {
    action,
    adapter: createEpisodeBulkAdapter(podcastId),
    ids,
    publishBase:
      action === 'publish' ? readBulkPublishBase(formData) : undefined,
  })
}
