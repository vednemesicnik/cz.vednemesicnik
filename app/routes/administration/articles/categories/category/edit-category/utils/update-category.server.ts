import type { ContentState } from '@generated/prisma/enums'
import { data } from 'react-router'
import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

type Options = {
  categoryId: string
  name: string
  slug: string
  authorId: string
  state: ContentState
}

export const updateCategory = async (
  request: Request,
  { categoryId, name, slug, authorId, state }: Options,
) => {
  return withAuthorPermission(request, {
    action: 'update',
    entity: 'article_category',
    execute: async (context) => {
      // A submitted draft is locked for its author (design 07d); read the stored
      // submission, the form doesn't carry it.
      const { submittedAt } = await prisma.articleCategory.findUniqueOrThrow({
        select: { submittedAt: true },
        where: { id: categoryId },
      })

      if (isLockedBySubmission({ roleLevel: context.roleLevel, submittedAt })) {
        throw data(null, { status: 403 })
      }

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
    target: { authorIds: [authorId], state },
  })
}
