import { requireCSRF } from '~/utils/csrf.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'

import { schema } from './_schema'
import type { Route } from './+types/route'
import { removePodcastCover } from './utils/remove-podcast-cover.server'
import { uploadPodcastCover } from './utils/upload-podcast-cover.server'

// A cancelled upload's client is gone; 499 is the code for that, by
// convention, and nobody reads it.
const CANCELLED_STATUS = 499

const STATUS_CODES = {
  cancelled: CANCELLED_STATUS,
  deleted: 410,
  failed: 422,
  'not-held': 409,
  saved: 200,
} as const

/**
 * Saves one change of the podcast's cover for the tab holding the edit hold
 * (design 27e): uploaded or replaced, or removed after a cancelled first
 * cover. A POST to a resource route runs only this action, so it requires the
 * session itself (`requireCSRF`). Answers JSON: `saved` with the new
 * `updatedAt`, `not-held` (409) with who holds it, `deleted` (410), `failed`
 * (422) for an image that could not be processed, or `invalid` (400). An
 * upload the editor cancelled (bxy8xxqs) stores nothing and is no error, even
 * when it was cancelled while its body was still arriving.
 */
export const action = async ({ request, params }: Route.ActionArgs) => {
  let formData: FormData
  try {
    formData = await getMultipartFormData(request)
  } catch (error) {
    if (request.signal.aborted) {
      return new Response(null, { status: CANCELLED_STATUS })
    }
    throw error
  }
  await requireCSRF(formData, request)

  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return Response.json({ status: 'invalid' }, { status: 400 })
  }

  const change = parsed.data
  const target = { podcastId: params.podcastId, tabId: change.editTabId }

  const result =
    change.intent === 'remove'
      ? await removePodcastCover(request, target)
      : await uploadPodcastCover(request, { ...target, file: change.file })

  return Response.json(result, { status: STATUS_CODES[result.status] })
}
