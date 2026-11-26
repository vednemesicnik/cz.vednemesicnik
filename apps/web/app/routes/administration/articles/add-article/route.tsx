// noinspection JSUnusedGlobalSymbols

import { href, redirect } from 'react-router'
import { requireCSRF } from '~/utils/csrf.server'

import type { Route } from './+types/route'
import { createDraftArticle } from './utils/create-draft-article.server'

// *Nový článek* is an action, not a page (log 0020): the old address leads
// to the list, and a POST creates the draft and opens it.

export const loader = () => redirect(href('/administration/articles'))

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  await requireCSRF(formData, request)

  const { articleId } = await createDraftArticle(request)

  return redirect(
    href('/administration/articles/:articleId/edit-article', { articleId }),
  )
}
