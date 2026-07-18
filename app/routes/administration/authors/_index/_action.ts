import { invariantResponse } from '@epic-web/invariant'

import { FORM_CONFIG } from '~/config/form-config'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { deleteAuthor } from '../author/_index/utils/delete-author'
import type { Route } from './+types/route'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

// Matches the bulk-actions bar cap — selection is offered per page.
const MAX_SELECTION = 20

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(INTENT_NAME)
  invariantResponse(intent === INTENT_VALUE.bulkDelete, 'Invalid intent')

  // Trim, drop empty values, and de-duplicate before the size guard so forged
  // `ids=` fields and repeated ids can't slip past validation or cause no-op /
  // repeated deletes.
  const ids = [
    ...new Set(
      formData
        .getAll('ids')
        .filter((id): id is string => typeof id === 'string')
        .map((id) => id.trim())
        .filter((id) => id !== ''),
    ),
  ]
  invariantResponse(
    ids.length > 0 && ids.length <= MAX_SELECTION,
    'Invalid selection size',
  )

  // Only authors without a linked user are deletable (onDelete: Restrict on the
  // user relation). Scoping to `user: null` mirrors the UI's `canDelete` gate
  // and keeps forged ids for linked authors from hitting an FK error.
  const authors = await prisma.author.findMany({
    select: { id: true },
    where: { id: { in: ids }, user: null },
  })

  // Sequential on purpose: each delete runs its own permission check. Not
  // atomic across items — the per-item check is defense in depth.
  for (const author of authors) {
    await deleteAuthor(request, {
      id: author.id,
      target: { userId: undefined },
    })
  }

  // App convention: the bulk-delete hook clears the selection only on an
  // explicit success. A denied item throws inside deleteAuthor before we get
  // here, so the selection stays for retry.
  return { status: 'success' as const }
}
