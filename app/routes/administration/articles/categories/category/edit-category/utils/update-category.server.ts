import { data } from 'react-router'
import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

type Options = {
  categoryId: string
  name: string
  slug: string
  authorId: string
}

/**
 * Saves an edit of a category. The permission is checked against the stored
 * author and state, never against the ones the form sends, and the new author
 * must be one the editor may set. The caller has checked the session
 * (`checkCSRF`).
 *
 * @param request - The action's request.
 * @param options - The category id and the edited fields.
 * @returns The category id.
 * @throws A 404 response for a missing category, a 403 response for a denied
 *   edit, a locked submission or an author the editor may not set.
 */
export const updateCategory = async (
  request: Request,
  { categoryId, name, slug, authorId }: Options,
) => {
  const storedCategory = await prisma.articleCategory.findUnique({
    select: { authorId: true, state: true, submittedAt: true },
    where: { id: categoryId },
  })

  if (storedCategory === null) {
    throw data(null, { status: 404 })
  }

  return withAuthorPermission(request, {
    action: 'update',
    entity: 'article_category',
    execute: async (context) => {
      // A submitted draft is locked for its author (design 07d).
      if (
        isLockedBySubmission({
          roleLevel: context.roleLevel,
          submittedAt: storedCategory.submittedAt,
        })
      ) {
        throw data(null, { status: 403 })
      }

      // Handing the category to another author needs the permission for them too.
      checkAuthorPermission(context, {
        action: 'update',
        entity: 'article_category',
        state: storedCategory.state,
        targetAuthorIds: [authorId],
      })

      const category = await prisma.articleCategory.update({
        data: {
          authorId,
          name,
          slug,
        },
        select: { id: true },
        where: { id: categoryId },
      })

      await recordContentLog(
        {
          entity: 'article_category',
          entityId: categoryId,
          events: ['update'],
        },
        context,
      )
      publishContentEvent(
        { change: 'update', entity: 'article_category', entityId: categoryId },
        context,
      )

      return category
    },
    target: {
      authorIds: [storedCategory.authorId],
      state: storedCategory.state,
    },
  })
}
