import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'

import { deleteStaleEmptyIssueDrafts } from './delete-stale-empty-issue-drafts.server'

/**
 * Creates an empty draft owned by the signed-in author, without a year or an
 * order: the editor offers the next free number, and only a confirmed one
 * saves (decisions 0020 and 0034). Nobody sees it until its first save or
 * upload. Empty drafts left over from earlier clicks are cleared first.
 *
 * @param request - The action's request; the caller has checked the session.
 * @returns The new draft's id.
 * @throws A 403 response when the author may not create issues.
 */
export const createDraftIssue = async (request: Request) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['issue'],
  })

  requireAuthorPermission(context, {
    action: 'create',
    entity: 'issue',
    state: 'draft',
    targetAuthorIds: [context.authorId],
  })

  // Housekeeping never fails the click: the next one clears what is left.
  await deleteStaleEmptyIssueDrafts().catch((error: unknown) => {
    console.error('Failed to delete stale empty issue drafts', error)
  })

  const draft = await prisma.issue.create({
    data: { authorId: context.authorId },
    select: { id: true },
  })

  return { issueId: draft.id }
}
