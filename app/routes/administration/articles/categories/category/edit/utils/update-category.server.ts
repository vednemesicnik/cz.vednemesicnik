import { data } from 'react-router'

import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { prisma } from '~/utils/db.server'
import { isUniqueConstraintError } from '~/utils/is-unique-constraint-error'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { requireContentUpdatePermission } from '~/utils/permissions/author/guards/require-content-update-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'
import { canChooseRecordAuthor } from '../../../../utils/can-choose-record-author'
import type { TaxonomyConflicts } from '../../../../utils/get-taxonomy-conflicts'
import { findCategoryConflicts } from '../../../utils/find-category-conflicts.server'

type Options = {
  categoryId: string
  name: string
  slug: string
  requestedAuthorId: string | undefined
}

type Result =
  | { status: 'success'; id: string }
  | ({ status: 'conflict' } & TaxonomyConflicts)

/**
 * Saves an edit of a category from its dialog (design 25c). The permission is
 * checked against the stored author and state, never against the form, and the
 * write only lands while they are still the ones checked. The caller has
 * checked the session (`checkCSRF`).
 *
 * @param request - The action's request.
 * @param options.requestedAuthorId - The author the form sends; only the
 *   Coordinator's choice counts, and it needs the permission for that author
 *   too. Any other role keeps the stored author.
 * @returns The category id, or what another category already holds, in which
 *   case nothing is written.
 * @throws A 404 response for a category the person may not view (30e), a 403
 *   response for a denied edit, a locked submission, an author the editor may
 *   not set, or a state changed since the check.
 */
export const updateCategory = async (
  request: Request,
  { categoryId, name, slug, requestedAuthorId }: Options,
): Promise<Result> => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'update'],
    entities: ['article_category'],
  })

  const storedCategory = await prisma.articleCategory.findUnique({
    select: { authorId: true, name: true, state: true, submittedAt: true },
    where: { id: categoryId },
  })

  if (storedCategory === null) {
    throw data(null, { status: 404 })
  }

  requireContentUpdatePermission(context, {
    authorIds: [storedCategory.authorId],
    id: categoryId,
    kind: 'category',
    state: storedCategory.state,
    title: storedCategory.name,
  })

  // A submitted draft is locked for its author (design 07d).
  if (
    isLockedBySubmission({
      roleLevel: context.roleLevel,
      submittedAt: storedCategory.submittedAt,
    })
  ) {
    throw data(null, { status: 403 })
  }

  const authorId = canChooseRecordAuthor(context.roleLevel)
    ? (requestedAuthorId ?? storedCategory.authorId)
    : storedCategory.authorId

  // Handing the category to another author needs the permission for them too.
  if (authorId !== storedCategory.authorId) {
    checkAuthorPermission(context, {
      action: 'update',
      entity: 'article_category',
      state: storedCategory.state,
      targetAuthorIds: [authorId],
    })
  }

  const conflicts = await findCategoryConflicts({
    excludeId: categoryId,
    name,
    slug,
  })

  if (conflicts.isNameTaken || conflicts.slugSuggestion !== null) {
    return { status: 'conflict', ...conflicts }
  }

  let count: number

  try {
    // Only while the state and the submission are still the ones checked.
    const result = await prisma.articleCategory.updateMany({
      data: { authorId, name, slug },
      where: {
        id: categoryId,
        state: storedCategory.state,
        submittedAt: storedCategory.submittedAt,
      },
    })
    count = result.count
  } catch (error) {
    // Someone took the name or the address between the check and the write.
    if (isUniqueConstraintError(error)) {
      return {
        status: 'conflict',
        ...(await findCategoryConflicts({ excludeId: categoryId, name, slug })),
      }
    }

    throw error
  }

  // Published, archived or submitted meanwhile: the generic 403 (30h).
  if (count === 0) {
    throw data(null, { status: 403 })
  }

  await recordContentLog(
    { entity: 'article_category', entityId: categoryId, events: ['update'] },
    context,
  )
  publishContentEvent(
    { change: 'update', entity: 'article_category', entityId: categoryId },
    context,
  )

  return { id: categoryId, status: 'success' }
}
