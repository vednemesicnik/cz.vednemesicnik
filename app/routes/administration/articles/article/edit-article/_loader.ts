import { data, href } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { articleId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['article'],
  })

  // Load the article
  const article = await prisma.article.findUnique({
    select: {
      authorId: true,
      categories: {
        select: { id: true },
      },
      content: true,
      featuredImage: {
        select: { id: true },
      },
      images: {
        select: {
          id: true,
        },
      },
      slug: true,
      state: true,
      tags: {
        select: { id: true },
      },
      title: true,
    },
    where: { id: articleId },
  })

  if (!article) {
    throw data('Article not found', { status: 404 })
  }

  requireAuthorPermission(context, {
    action: 'update',
    entity: 'article',
    redirectTo: href('/administration/articles'),
    state: article.state,
    targetAuthorId: article.authorId,
  })

  const [authors, categories, tags] = await Promise.all([
    // Authors with permission to update articles in the current state
    getAuthorsByPermission(context, 'article', 'update', article.state),
    // Published categories
    prisma.articleCategory.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
      where: {
        state: 'published',
      },
    }),
    // Published tags
    prisma.articleTag.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
      where: {
        state: 'published',
      },
    }),
  ])

  return {
    article: {
      authorId: article.authorId,
      categoryIds: article.categories.map((category) => category.id),
      content: article.content,
      featuredImageId: article.featuredImage?.id,
      images: article.images.map((image) => ({ id: image.id })),
      slug: article.slug,
      state: article.state,
      tagIds: article.tags.map((tag) => tag.id),
      title: article.title,
    },
    authors,
    categories,
    tags,
  }
}
