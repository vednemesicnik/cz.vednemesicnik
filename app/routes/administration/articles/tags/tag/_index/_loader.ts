import { data } from 'react-router'

import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { tagId } = params

  const tag = await prisma.articleTag.findUnique({
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
    where: { id: tagId },
  })

  if (tag === null) {
    throw new Response('Tag nenalezen', { status: 404 })
  }

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
    entities: ['article_tag'],
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorIds: [tag.author.id],
  })

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!canView) {
    throw data(null, { status: 404 })
  }

  const flags = getContentActionFlags(context, 'article_tag', {
    authors: [tag.author],
    reviews: tag.reviews,
    state: tag.state,
    submittedAt: tag.submittedAt,
  })

  return {
    tag: {
      author: tag.author,
      history: await getContentHistory({
        createdAt: tag.createdAt,
        entity: 'article_tag',
        entityId: tag.id,
        publishedAt: tag.publishedAt,
      }),
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      state: tag.state,
    },
    ...flags,
    submission: flags.submission?.state ?? null,
  }
}
