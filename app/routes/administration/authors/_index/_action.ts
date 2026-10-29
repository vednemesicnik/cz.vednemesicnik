import { invariantResponse } from '@epic-web/invariant'

import type { BulkActionResult } from '~/utils/bulk-action/bulk-action-result'
import { readBulkActionForm } from '~/utils/bulk-action/read-bulk-action-form'
import { requireCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { deleteAuthor } from '../author/_index/utils/delete-author'
import type { Route } from './+types/route'

export const action = async ({
  request,
}: Route.ActionArgs): Promise<BulkActionResult> => {
  const formData = await request.formData()
  await requireCSRF(formData, request)

  // An author has no lifecycle: deleting is the list's only bulk action (28g).
  const { action, ids } = readBulkActionForm(formData)
  invariantResponse(action === 'delete', 'Invalid intent')

  // An author with an account is never deletable, so it is left out before the
  // permission check: a forged id of an account the caller may not touch would
  // otherwise stop the loop halfway.
  const authors = await prisma.author.findMany({
    select: { id: true },
    where: { id: { in: ids }, user: null },
  })

  // Sequential on purpose: each delete runs its own permission check and its
  // own guard (#767). An author something holds is skipped, not an error: the
  // selection offers only deletable authors, so it changed in the meantime.
  let deletedCount = 0

  for (const author of authors) {
    const result = await deleteAuthor(request, {
      id: author.id,
      target: { userId: undefined },
    })

    if (result.status === 'deleted') {
      deletedCount += 1
    }
  }

  // A skipped author is not counted and not mentioned (28g, h2twqjee).
  return {
    action: 'delete',
    hasRelated: false,
    onlyDrafts: false,
    processedCount: deletedCount,
    skippedCount: 0,
  }
}
