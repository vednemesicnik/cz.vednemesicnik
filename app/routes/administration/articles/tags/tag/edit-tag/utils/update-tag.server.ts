import { data } from 'react-router'
import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

type Options = {
  tagId: string
  name: string
  slug: string
  authorId: string
}

/**
 * Saves an edit of a tag. The permission is checked against the stored author
 * and state, never against the ones the form sends, and the new author must
 * be one the editor may set. The caller has checked the session (`checkCSRF`).
 *
 * @param request - The action's request.
 * @param options - The tag id and the edited fields.
 * @returns The tag id.
 * @throws A 404 response for a missing tag, a 403 response for a denied edit,
 *   a locked submission or an author the editor may not set.
 */
export const updateTag = async (
  request: Request,
  { tagId, name, slug, authorId }: Options,
) => {
  const storedTag = await prisma.articleTag.findUnique({
    select: { authorId: true, state: true, submittedAt: true },
    where: { id: tagId },
  })

  if (storedTag === null) {
    throw data(null, { status: 404 })
  }

  return withAuthorPermission(request, {
    action: 'update',
    entity: 'article_tag',
    execute: async (context) => {
      // A submitted draft is locked for its author (design 07d).
      if (
        isLockedBySubmission({
          roleLevel: context.roleLevel,
          submittedAt: storedTag.submittedAt,
        })
      ) {
        throw data(null, { status: 403 })
      }

      // Handing the tag to another author needs the permission for them too.
      checkAuthorPermission(context, {
        action: 'update',
        entity: 'article_tag',
        state: storedTag.state,
        targetAuthorIds: [authorId],
      })

      const tag = await prisma.articleTag.update({
        data: {
          authorId,
          name,
          slug,
        },
        select: { id: true },
        where: { id: tagId },
      })

      await recordContentLog(
        { entity: 'article_tag', entityId: tagId, events: ['update'] },
        context,
      )
      publishContentEvent(
        { change: 'update', entity: 'article_tag', entityId: tagId },
        context,
      )

      return tag
    },
    target: { authorIds: [storedTag.authorId], state: storedTag.state },
  })
}
