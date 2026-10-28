import { requireCSRF } from '~/utils/csrf.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'

import { schema } from './_schema'
import type { Route } from './+types/route'
import { uploadPodcastCover } from './utils/upload-podcast-cover.server'

const STATUS_CODES = {
  deleted: 410,
  failed: 422,
  'not-held': 409,
  saved: 200,
} as const

/**
 * Saves one upload of the podcast's cover for the tab holding the edit hold
 * (design 27e). A POST to a resource route runs only this action, so it
 * requires the session itself (`requireCSRF`). Answers JSON: `saved` with the
 * new `updatedAt`, `not-held` (409) with who holds it, `deleted` (410),
 * `failed` (422) for an image that could not be processed, or `invalid` (400).
 */
export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await getMultipartFormData(request)
  await requireCSRF(formData, request)

  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return Response.json({ status: 'invalid' }, { status: 400 })
  }

  const result = await uploadPodcastCover(request, {
    file: parsed.data.file,
    podcastId: params.podcastId,
    tabId: parsed.data.editTabId,
  })

  return Response.json(result, { status: STATUS_CODES[result.status] })
}
