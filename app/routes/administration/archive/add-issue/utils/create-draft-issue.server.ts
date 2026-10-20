import { prisma } from '~/utils/db.server'
import { getPragueYear } from '~/utils/get-prague-year'
import { isUniqueConstraintError } from '~/utils/is-unique-constraint-error.server'
import { getNextFreeIssueOrder } from '~/utils/issue/get-next-free-issue-order'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'

import { deleteStaleEmptyIssueDrafts } from './delete-stale-empty-issue-drafts.server'

const createWithNextOrder = async (authorId: string, year: number) => {
  const mainIssues = await prisma.issue.findMany({
    select: { order: true },
    where: { order: { not: null }, supplementSlug: '', year },
  })

  return prisma.issue.create({
    data: {
      authorId,
      order: getNextFreeIssueOrder(
        mainIssues.flatMap(({ order }) => (order === null ? [] : [order])),
      ),
      year,
    },
    select: { id: true },
  })
}

/**
 * Creates an empty draft owned by the signed-in author, with this year and the
 * year's next free order (design 26c, decisions 0020 and 0032). Nobody sees it
 * until its first save or upload. Empty drafts left over from earlier clicks
 * are cleared first, so they don't hold a number.
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

  const year = getPragueYear(new Date())

  let draft: { id: string }
  try {
    draft = await createWithNextOrder(context.authorId, year)
  } catch (error) {
    // Another click took the same order meanwhile: once more after it.
    if (!isUniqueConstraintError(error)) throw error
    draft = await createWithNextOrder(context.authorId, year)
  }

  return { issueId: draft.id }
}
