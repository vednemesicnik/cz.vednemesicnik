import { parseWithZod } from '@conform-to/zod/v4'

import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { requireCSRF } from '~/utils/csrf.server'

import { schema } from '../edit-episode/_schema'
import { updateEpisode } from '../edit-episode/utils/update-episode.server'
import type { Route } from './+types/route'

/**
 * Saves the episode editor's whole form for the tab holding the edit hold
 * (design 27d, logs 0022 and 0048). A POST to a resource route runs only this
 * action, so it requires the session itself (`requireCSRF`). A number that
 * can't be read leaves the stored one as it is and the rest saves. Answers
 * JSON for the editor's autosave: `saved` with the new `updatedAt` and the
 * taken values, `not-held` (409) with who holds it, `deleted` (410), or
 * `invalid` (400).
 */
export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData()
  await requireCSRF(formData, request)

  let submission = parseWithZod(formData, { schema })
  let isNumberUnread = false

  // Only the number failed: the rest saves without it.
  if (
    submission.status !== 'success' &&
    Object.keys(submission.error ?? {}).every((field) => field === 'number')
  ) {
    formData.delete('number')
    submission = parseWithZod(formData, { schema })
    isNumberUnread = true
  }

  if (submission.status !== 'success') {
    return Response.json({ status: 'invalid' }, { status: 400 })
  }

  const { editTabId, authorId, title, description, number, slug, links } =
    submission.value

  const result = await updateEpisode(request, {
    authorId,
    description,
    episodeId: params.episodeId,
    links: links ?? [],
    number: isNumberUnread ? undefined : (number ?? null),
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
