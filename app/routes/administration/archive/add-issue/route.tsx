// noinspection JSUnusedGlobalSymbols

import { href, redirect } from 'react-router'
import { requireCSRF } from '~/utils/csrf.server'

import type { Route } from './+types/route'
import { createDraftIssue } from './utils/create-draft-issue.server'

// *Nové číslo* is an action, not a page (decision 0020, design 26c): the old
// address leads to the list, and a POST creates the draft and opens it.

export const loader = () => redirect(href('/administration/archive'))

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  await requireCSRF(formData, request)

  const { issueId } = await createDraftIssue(request)

  return redirect(
    href('/administration/archive/:issueId/edit-issue', { issueId }),
  )
}
