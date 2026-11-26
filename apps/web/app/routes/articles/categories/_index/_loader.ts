import { buildVisibleArticleWhere } from '~/routes/articles/utils/build-visible-article-where'
import { getListPreview } from '~/utils/content-preview/get-list-preview'
import { getWebPreviewState } from '~/utils/content-preview/get-web-preview-state'
import { takeDraftsFirst } from '~/utils/content-preview/take-drafts-first'
import { WEB_PREVIEW_STATE_SELECT } from '~/utils/content-preview/web-preview-state-select'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import { hasSlug } from '~/utils/has-slug'
import { nameCollator } from '~/utils/name-collator'
import {
  getWebContentVisibility,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'
import { findTagsWithArticleCounts } from '../../utils/find-tags-with-article-counts.server'
import { pickTopByArticleCount } from '../../utils/pick-top-by-article-count'
import type { Route } from './+types/route'

const LATEST_ARTICLES_PER_CATEGORY = 2
const TAG_STRIP_SIZE = 3

const latestArticleSelect = {
  ...WEB_PREVIEW_STATE_SELECT,
  id: true,
  publishedAt: true,
  slug: true,
  title: true,
} as const

export const loader = async ({ request }: Route.LoaderArgs) => {
  const visibility = await getWebContentVisibility(request, [
    'article',
    'article_category',
    'article_tag',
  ])
  const visibleArticles = buildVisibleArticleWhere(visibility)

  // A category's latest articles put its drafts on top (10d). The drafts are
  // few, so they come in one query and are grouped here.
  const [categories, drafts, tags] = await Promise.all([
    prisma.articleCategory.findMany({
      select: {
        ...WEB_PREVIEW_STATE_SELECT,
        _count: {
          select: {
            articles: { where: visibleArticles },
          },
        },
        articles: {
          orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
          select: latestArticleSelect,
          take: LATEST_ARTICLES_PER_CATEGORY,
          where: { AND: [visibleArticles, { state: { not: 'draft' } }] },
        },
        id: true,
        name: true,
        slug: true,
      },
      where: visibility.where('article_category', ownByAuthor),
    }),
    prisma.article.findMany({
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      select: { ...latestArticleSelect, categories: { select: { id: true } } },
      where: { AND: [visibleArticles, { state: 'draft' }] },
    }),
    findTagsWithArticleCounts(visibility),
  ])

  // Hide taxonomies whose visible article count is zero.
  const categoriesWithArticles = categories
    .filter((category) => category._count.articles > 0)
    .sort((first, second) => nameCollator.compare(first.name, second.name))
    .map((category) => ({
      articleCount: category._count.articles,
      id: category.id,
      latestArticles: takeDraftsFirst(
        drafts.filter((draft) =>
          draft.categories.some(({ id }) => id === category.id),
        ),
        category.articles,
        LATEST_ARTICLES_PER_CATEGORY,
      )
        .filter(hasSlug)
        .map(
          ({ id, publishedAt, reviews, slug, state, submittedAt, title }) => ({
            id,
            previewState: getWebPreviewState({ reviews, state, submittedAt }),
            publishedAt: createFormattedDate(publishedAt),
            slug,
            title,
          }),
        ),
      name: category.name,
      previewState: getWebPreviewState(category),
      slug: category.slug,
    }))

  const tagLinks = pickTopByArticleCount(tags, TAG_STRIP_SIZE).map((tag) => ({
    name: tag.name,
    previewState: tag.previewState,
    slug: tag.slug,
  }))

  return {
    categories: categoriesWithArticles,
    preview: getListPreview([
      ...categoriesWithArticles,
      ...categoriesWithArticles.flatMap((category) => category.latestArticles),
      ...tagLinks,
    ]),
    tagLinks,
  }
}
