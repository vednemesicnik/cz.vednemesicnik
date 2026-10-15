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
  const { tagId } = params

  const tag = await prisma.articleTag.findUnique({
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
    // Viewing articles scopes the record's article list and counts (25b).
    entities: ['article_tag', 'article'],
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

  const relationWhere = { tags: { some: { id: tag.id } } }

  const [articles, articleCount, history] = await Promise.all([
    getTaxonomyArticleSummary(context, relationWhere),
    // Deleting takes the tag off every article it has, in any state, whoever
    // may see them (25d): the list row's count.
    prisma.article.count({ where: relationWhere }),
    getContentHistory({
      createdAt: tag.createdAt,
      entity: 'article_tag',
      entityId: tag.id,
      publishedAt: tag.publishedAt,
    }),
  ])

  return {
    articles,
    headerActions: getTaxonomyHeaderActions({
      ...flags,
      state: tag.state,
      submission: flags.submission?.state ?? null,
    }),
    tag: {
      articleCount,
      authorName: tag.author.name,
      factLine: getArticleFactLine({
        now: new Date(),
        publishedAt: tag.publishedAt,
        state: tag.state,
        submission: flags.submission,
        updatedAt: tag.updatedAt,
      }),
      history,
      id: tag.id,
      name: tag.name,
      publishedArticleCount: tag._count.articles,
      slug: tag.slug,
      state: flags.submission?.state ?? tag.state,
    },
  }
}
