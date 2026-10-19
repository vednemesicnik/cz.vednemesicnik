import { requireCSRF } from '~/utils/csrf.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'

import { schema } from './_schema'
import type { Route } from './+types/route'
import { removeArticleImage } from './utils/remove-article-image.server'
import { reorderArticleImages } from './utils/reorder-article-images.server'
import { setArticleFeaturedImage } from './utils/set-article-featured-image.server'
import { uploadArticleImage } from './utils/upload-article-image.server'

// A cancelled upload's client is gone; 499 is the code for that, by
// convention, and nobody reads it.
const CANCELLED_STATUS = 499

const STATUS_CODES = {
  cancelled: CANCELLED_STATUS,
  failed: 422,
  'not-held': 409,
  saved: 200,
} as const

/**
 * Saves one change of the article editor's gallery for the tab holding the
 * edit hold (design 24b, decision 0027): an upload, a removal, the main image
 * or the order. A POST to a resource route runs only this action, so it
 * requires the session itself (`requireCSRF`). Answers JSON: `saved` with the
 * new `updatedAt` (and an upload's preview), `not-held` (409) with who holds
 * it, `failed` (422) for a file that could not be processed, or `invalid`
 * (400). An upload the editor cancelled (bxy8xxqs) stores nothing and is no
 * error, even when it was cancelled while its body was still arriving.
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

  const parsed = schema.safeParse({
    ...Object.fromEntries(formData),
    imageIds: formData.getAll('imageIds'),
  })

  if (!parsed.success) {
    return Response.json({ status: 'invalid' }, { status: 400 })
  }

  const change = parsed.data
  const target = { articleId: params.articleId, tabId: change.editTabId }

  const result =
    change.intent === 'upload'
      ? await uploadArticleImage(request, {
          ...target,
          altText: change.altText,
          description: change.description,
          file: change.file,
          imageId: change.imageId,
        })
      : change.intent === 'remove'
        ? await removeArticleImage(request, {
            ...target,
            imageId: change.imageId,
          })
        : change.intent === 'feature'
          ? await setArticleFeaturedImage(request, {
              ...target,
              imageId: change.imageId ?? null,
            })
          : await reorderArticleImages(request, {
              ...target,
              imageIds: change.imageIds,
            })

  return Response.json(result, { status: STATUS_CODES[result.status] })
}
