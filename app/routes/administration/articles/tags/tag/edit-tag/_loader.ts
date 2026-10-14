import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireContentUpdatePermission } from '~/utils/permissions/author/guards/require-content-update-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { tagId } = params

  const tag = await prisma.articleTag.findUnique({
    select: {
      author: {
        select: {
          id: true,
        },
      },
      authorId: true,
      id: true,
      name: true,
      slug: true,
      state: true,
      submittedAt: true,
    },
    where: { id: tagId },
  })

  if (tag === null) {
    throw new Response('Tag nenalezen', { status: 404 })
  }

  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'update'],
    entities: ['article_tag'],
  })

  requireContentUpdatePermission(context, {
    authorIds: [tag.authorId],
    id: tagId,
    kind: 'tag',
    state: tag.state,
    title: tag.name,
  })

  // A submitted draft is locked for its author until they take it back
  // (design 07d). Design 30d has no reason for it yet, so the generic 403 (30h).
  if (
    isLockedBySubmission({
      roleLevel: context.roleLevel,
      submittedAt: tag.submittedAt,
    })
  ) {
    throw data(null, { status: 403 })
  }

  const authors = await getAuthorsByPermission(
    context,
    'article_category',
    'update',
    tag.state,
  )

  return {
    authors,
    tag,
  }
}
