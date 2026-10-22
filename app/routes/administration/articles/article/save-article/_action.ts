import { parseWithZod } from '@conform-to/zod/v4'

import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { requireCSRF } from '~/utils/csrf.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'

import { schema } from '../edit-article/_schema'
import { updateArticle } from '../edit-article/utils/update-article.server'
import type { Route } from './+types/route'

/**
 * Saves the article editor's whole form for the tab holding the edit hold
 * (design 24e, decisions 0019 and 0022). A POST to a resource route runs only
 * this action, so it requires the session itself (`requireCSRF`). Answers
 * JSON for the editor's autosave: `saved` with the new `updatedAt` and a free
 * address for a taken one, `not-held` (409) with who holds it, `deleted` (410), or `invalid`
 * (400).
 */
export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await getMultipartFormData(request)
  await requireCSRF(formData, request)

  const submission = await parseWithZod(formData, { async: true, schema })

  if (submission.status !== 'success') {
    return Response.json({ status: 'invalid' }, { status: 400 })
  }

  const { editTabId, ...fields } = submission.value

  const result = await updateArticle(request, {
    ...fields,
    articleId: params.articleId,
    releaseHold: formData.get(EDIT_HOLD_CONFIG.releaseHoldName) === 'true',
    tabId: editTabId,
  })

  if (result.status === 'not-held') {
    return Response.json(result, { status: 409 })
  }

  // Gone meanwhile (decision 0036): the editor turns read-only and says so.
  if (result.status === 'deleted') {
    return Response.json(result, { status: 410 })
  }

  return Response.json(result)
}
