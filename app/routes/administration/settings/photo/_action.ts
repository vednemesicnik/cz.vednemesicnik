import type { ActionFunctionArgs } from 'react-router'

import { IMAGE_OVER_PIXEL_BUDGET_MESSAGE } from '~/config/image-variants-config'
import { requireAuthentication } from '~/utils/auth.server'
import { requireCSRF } from '~/utils/csrf.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { isImageOverPixelBudget } from '~/utils/image-store/is-image-over-pixel-budget.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'

import {
  FAILED_MESSAGE,
  IMAGE_TOO_LARGE_MESSAGE,
  NOT_AN_IMAGE_MESSAGE,
  schema,
} from './_schema'
import { deleteUserImage } from './utils/delete-user-image.server'
import {
  type SaveUserImageResult,
  saveUserImage,
} from './utils/save-user-image.server'

// A cancelled upload's client is gone; 499 is the code for that, by
// convention, and nobody reads it.
const CANCELLED_STATUS = 499

// Only the upload is multipart; a file over the parser's limit throws.
const readFormData = (request: Request) =>
  (request.headers.get('Content-Type') ?? '').startsWith('multipart/form-data')
    ? getMultipartFormData(request)
    : request.formData()

/**
 * Saves one change of the signed-in person's profile photo (design 29b): an
 * upload or a removal. Whose photo changes comes from the session, never from
 * the form. A POST to a resource route runs only this action, so it requires
 * the session itself (`requireCSRF`). Answers JSON: `saved`, `removed`,
 * `invalid` (400, 413) or `failed` (422) with the sentence to show. An upload
 * the person cancelled (decision 0029) stores nothing and is no error, even
 * when it was cancelled while its body was still arriving.
 */
export const action = async ({ request, url }: ActionFunctionArgs) => {
  const { userId } = await requireAuthentication({ request, url })

  let formData: FormData
  try {
    formData = await readFormData(request)
  } catch {
    if (request.signal.aborted) {
      return new Response(null, { status: CANCELLED_STATUS })
    }
    return Response.json(
      { imageError: IMAGE_TOO_LARGE_MESSAGE, status: 'invalid' },
      { status: 413 },
    )
  }
  await requireCSRF(formData, request)

  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['author'],
  })

  checkUserPermission(context, {
    action: 'update',
    entity: 'author',
    targetUserId: userId,
  })

  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    const imageIssue = parsed.error.issues.find(
      (issue) => issue.path[0] === 'image',
    )
    return Response.json(
      {
        imageError: imageIssue?.message ?? NOT_AN_IMAGE_MESSAGE,
        status: 'invalid',
      },
      { status: 400 },
    )
  }

  if (parsed.data.intent === 'remove') {
    await deleteUserImage(userId)
    return Response.json({ status: 'removed' })
  }

  if (await isImageOverPixelBudget(parsed.data.image)) {
    return Response.json(
      { imageError: IMAGE_OVER_PIXEL_BUDGET_MESSAGE, status: 'invalid' },
      { status: 400 },
    )
  }

  let result: SaveUserImageResult
  try {
    result = await saveUserImage(request, {
      file: parsed.data.image,
      userId,
    })
  } catch {
    result = { status: 'failed' }
  }

  if (result.status === 'cancelled') {
    return Response.json(result, { status: CANCELLED_STATUS })
  }

  if (result.status === 'failed') {
    return Response.json(
      { imageError: FAILED_MESSAGE, status: 'failed' },
      { status: 422 },
    )
  }

  return Response.json(result)
}
