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

export const updateTag = async (
  request: Request,
  { tagId, name, slug, authorId }: Options,
) => {
  // The permission is checked against the stored tag, never against the
  // author or state the form sends.
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
