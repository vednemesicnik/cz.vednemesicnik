import { data } from 'react-router'

import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { categoryId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: [
      'view',
      'update',
      'delete',
      'publish',
      'retract',
      'archive',
      'restore',
      'review',
    ],
    entities: ['article_category'],
  })

  const category = await prisma.articleCategory.findUnique({
    select: {
      author: {
        select: {
          id: true,
          name: true,
          role: {
            select: {
              level: true,
            },
          },
        },
      },
      createdAt: true,
      id: true,
      name: true,
      publishedAt: true,
      reviews: {
        select: {
          createdAt: true,
          reviewer: {
            select: { id: true, role: { select: { level: true } } },
          },
        },
      },
      slug: true,
      state: true,
      submittedAt: true,
    },
    where: { id: categoryId },
  })

  if (category === null) {
    throw new Response('Kategorie nenalezena', { status: 404 })
  }

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'article_category',
    state: category.state,
    targetAuthorIds: [category.author.id],
  })

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!canView) {
    throw data(null, { status: 404 })
  }

  const flags = getContentActionFlags(context, 'article_category', {
    authors: [category.author],
    reviews: category.reviews,
    state: category.state,
    submittedAt: category.submittedAt,
  })

  return {
    category: {
      author: category.author,
      history: await getContentHistory({
        createdAt: category.createdAt,
        entity: 'article_category',
        entityId: category.id,
        publishedAt: category.publishedAt,
      }),
      id: category.id,
      name: category.name,
      slug: category.slug,
      state: category.state,
    },
    ...flags,
    submission: flags.submission?.state ?? null,
  }
}
