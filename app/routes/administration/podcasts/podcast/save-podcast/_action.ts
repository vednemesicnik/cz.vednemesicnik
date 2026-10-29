import { parseWithZod } from '@conform-to/zod/v4'

import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { requireCSRF } from '~/utils/csrf.server'

import { schema } from '../edit-podcast/_schema'
import { updatePodcast } from '../edit-podcast/utils/update-podcast.server'
import type { Route } from './+types/route'

/**
 * Saves the podcast editor's whole form for the tab holding the edit hold
 * (design 27e, log 0022). A POST to a resource route runs only this action,
 * so it requires the session itself (`requireCSRF`). Answers JSON for the
 * editor's autosave: `saved` with the new `updatedAt` and the taken address,
 * `not-held` (409) with who holds it, `deleted` (410), or `invalid` (400).
 */
export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData()
  await requireCSRF(formData, request)

  const submission = parseWithZod(formData, { schema })

  if (submission.status !== 'success') {
    return Response.json({ status: 'invalid' }, { status: 400 })
  }

  const { editTabId, authorId, title, description, slug } = submission.value

  const result = await updatePodcast(request, {
    authorId,
    description,
    podcastId: params.podcastId,
    releaseHold: formData.get(EDIT_HOLD_CONFIG.releaseHoldName) === 'true',
    slug,
    tabId: editTabId,
    title,
  })

  if (result.status === 'not-held') {
    return Response.json(result, { status: 409 })
  }

  // Gone meanwhile (log 0036): the editor turns read-only and says so.
  if (result.status === 'deleted') {
    return Response.json(result, { status: 410 })
  }

  return Response.json(result)
}
