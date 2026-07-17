import { invariantResponse } from '@epic-web/invariant'

import { FORM_CONFIG } from '~/config/form-config'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { deleteArticle } from '../article/_index/utils/delete-article'
import type { Route } from './+types/route'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

// Matches the list page size — the bar only offers selection on the current page.
const MAX_SELECTION = 20

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(intent === INTENT_VALUE.bulkDelete, 'Invalid intent')

  const ids = formData
    .getAll('ids')
    .filter((id): id is string => typeof id === 'string')
  invariantResponse(
    ids.length > 0 && ids.length <= MAX_SELECTION,
    'Invalid selection size',
  )

  const articles = await prisma.article.findMany({
    select: { authors: { select: { id: true } }, id: true, state: true },
    where: { id: { in: ids } },
  })

  // Sequential on purpose: each delete runs its own permission check and
  // image-cleanup transaction. Not atomic across items — the UI only offers
  // deletable rows; the per-item check is defense in depth.
  for (const article of articles) {
    await deleteArticle(request, {
      id: article.id,
      target: {
        authorIds: article.authors.map((author) => author.id),
        state: article.state,
      },
    })
  }

  // App convention: the bulk-delete hook clears the selection only on an
  // explicit success. A denied item throws inside deleteArticle before we get
  // here, so the selection stays for retry.
  return { status: 'success' as const }
}
