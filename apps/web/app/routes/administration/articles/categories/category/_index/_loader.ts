import { data } from 'react-router'

import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'

import { getArticleFactLine } from '../../../utils/get-article-fact-line'
import { getTaxonomyArticleSummary } from '../../../utils/get-taxonomy-article-summary.server'
import { getTaxonomyHeaderActions } from '../../../utils/get-taxonomy-header-actions'
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
    // Viewing articles scopes the record's article list and counts (25b).
    entities: ['article_category', 'article'],
  })

  const category = await prisma.articleCategory.findUnique({
    select: {
      // What readers lose when it is retracted or archived (25d).
      _count: {
        select: { articles: { where: { state: 'published' } } },
      },
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
      updatedAt: true,
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

  const relationWhere = { categories: { some: { id: category.id } } }

  const [articles, articleCount, history] = await Promise.all([
    getTaxonomyArticleSummary(context, relationWhere),
    // Deleting takes the category off every article it has, in any state,
    // whoever may see them (25d): the list row's count.
    prisma.article.count({ where: relationWhere }),
    getContentHistory({
      createdAt: category.createdAt,
      entity: 'article_category',
      entityId: category.id,
      publishedAt: category.publishedAt,
    }),
  ])

  return {
    articles,
    category: {
      articleCount,
      authorName: category.author.name,
      factLine: getArticleFactLine({
        now: new Date(),
        publishedAt: category.publishedAt,
        state: category.state,
        submission: flags.submission,
        updatedAt: category.updatedAt,
      }),
      history,
      id: category.id,
      name: category.name,
      publishedArticleCount: category._count.articles,
      slug: category.slug,
      state: flags.submission?.state ?? category.state,
    },
    headerActions: getTaxonomyHeaderActions({
      ...flags,
      state: category.state,
      submission: flags.submission?.state ?? null,
    }),
  }
}
