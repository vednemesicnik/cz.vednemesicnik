import { parseWithZod } from '@conform-to/zod/v4'

import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { requireCSRF } from '~/utils/csrf.server'

import { ISSUE_NUMBER_FIELDS, schema } from '../edit-issue/_schema'
import { updateIssue } from '../edit-issue/utils/update-issue.server'
import type { Route } from './+types/route'

const isNumberField = (field: string) =>
  (ISSUE_NUMBER_FIELDS as readonly string[]).includes(field)

/**
 * Saves the issue editor's whole form for the tab holding the edit hold
 * (design 26c, decisions 0022 and 0034). A POST to a resource route runs only
 * this action, so it requires the session itself (`requireCSRF`). A year,
 * order or supplement that can't be read leaves the stored number as it is and
 * the rest saves. Answers JSON for the editor's autosave: `saved` with the new
 * `updatedAt` and a taken number, `not-held` (409) with who holds it, or
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
    Object.keys(submission.error ?? {}).every(isNumberField)
  ) {
    const withoutNumber = new FormData()
    for (const [key, value] of formData) {
      if (!isNumberField(key)) withoutNumber.append(key, value)
    }
    submission = parseWithZod(withoutNumber, { schema })
    isNumberUnread = true
  }

  if (submission.status !== 'success') {
    return Response.json({ status: 'invalid' }, { status: 400 })
  }

  const { editTabId, authorId, name, year, order, supplement } =
    submission.value

  const result = await updateIssue(request, {
    authorId,
    issueId: params.issueId,
    name,
    number: isNumberUnread
      ? null
      : {
          order: order ?? null,
          supplement: supplement === '' ? null : supplement,
          year: year ?? null,
        },
    releaseHold: formData.get(EDIT_HOLD_CONFIG.releaseHoldName) === 'true',
    tabId: editTabId,
  })

  if (result.status === 'not-held') {
    return Response.json(result, { status: 409 })
  }

  return Response.json(result)
}
