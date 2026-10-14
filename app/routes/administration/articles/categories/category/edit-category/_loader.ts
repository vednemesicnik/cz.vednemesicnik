import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireContentUpdatePermission } from '~/utils/permissions/author/guards/require-content-update-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'update'],
    entities: ['article_category'],
  })

  const category = await prisma.articleCategory.findUniqueOrThrow({
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
    where: { id: params.categoryId },
  })

  requireContentUpdatePermission(context, {
    authorIds: [category.authorId],
    id: params.categoryId,
    kind: 'category',
    state: category.state,
    title: category.name,
  })

  // A submitted draft is locked for its author until they take it back
  // (design 07d). Design 30d has no reason for it yet, so the generic 403 (30h).
  if (
    isLockedBySubmission({
      roleLevel: context.roleLevel,
      submittedAt: category.submittedAt,
    })
  ) {
    throw data(null, { status: 403 })
  }

  const authors = await getAuthorsByPermission(
    context,
    'article_category',
    'update',
    category.state,
  )

  return {
    authors,
    category,
  }
}
