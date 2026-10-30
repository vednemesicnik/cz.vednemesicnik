import { data, href } from 'react-router'
import type { NotFoundPageData } from '~/components/boundary-error'
import { PAGE_PARAM } from '~/components/pagination'
import { buildVisibleArticleWhere } from '~/routes/articles/utils/build-visible-article-where'
import { findArticlesDraftsFirst } from '~/routes/articles/utils/find-articles-drafts-first.server'
import { getListPreview } from '~/utils/content-preview/get-list-preview'
import { getWebPreviewState } from '~/utils/content-preview/get-web-preview-state'
import type { PagePreview } from '~/utils/content-preview/page-preview'
import { WEB_PREVIEW_STATE_SELECT } from '~/utils/content-preview/web-preview-state-select'
import { withWebPreviewState } from '~/utils/content-preview/with-web-preview-state'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import { hasSlug } from '~/utils/has-slug'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { isPagePastLast } from '~/utils/is-page-past-last'
import { parsePositiveIntegerParam } from '~/utils/parse-positive-integer-param'
import {
  getWebContentVisibility,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'
import type { Route } from './+types/route'

const PAGE_SIZE = 9

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { slug } = params

  const visibility = await getWebContentVisibility(request, [
    'article',
    'article_category',
    'article_tag',
  ])

  const tag = await prisma.articleTag.findUnique({
    select: { ...WEB_PREVIEW_STATE_SELECT, id: true, name: true, slug: true },
    where: { slug, ...visibility.where('article_tag', ownByAuthor) },
  })

  if (!tag) {
    throw data(null, { status: 404 })
  }

  const url = new URL(request.url)
  const currentPage = parsePositiveIntegerParam(url.searchParams, PAGE_PARAM, 1)

  const where = {
    ...buildVisibleArticleWhere(visibility),
    tags: { some: { slug } },
  }

  const [articles, totalCount] = await Promise.all([
    findArticlesDraftsFirst({
      select: {
        ...WEB_PREVIEW_STATE_SELECT,
        authors: {
          select: {
            name: true,
          },
        },
        categories: {
          select: {
            ...WEB_PREVIEW_STATE_SELECT,
            name: true,
            slug: true,
          },
          where: visibility.where('article_category', ownByAuthor),
        },
        featuredImage: {
          select: imageSourceSelect,
        },
        id: true,
        publishedAt: true,
        slug: true,
        title: true,
      },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
      withDrafts: visibility.previewMode === 'staff',
    }),
    prisma.article.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  if (isPagePastLast(currentPage, totalPages)) {
    const notFoundData: NotFoundPageData = { cause: 'page-past-last' }
    throw data(notFoundData, { status: 404 })
  }

  const articlesWithSources = articles
    .filter(hasSlug)
    .map(({ reviews, state, submittedAt, ...article }) => ({
      ...article,
      categories: article.categories.map(withWebPreviewState),
      featuredImage: article.featuredImage
        ? {
            altText: article.featuredImage.altText,
            sources: createImageSources('article-image', article.featuredImage),
          }
        : null,
      previewState: getWebPreviewState({ reviews, state, submittedAt }),
      publishedAt: createFormattedDate(article.publishedAt),
    }))

  const { id, ...tagFields } = tag
  const tagWithPreview = withWebPreviewState(tagFields)

  // An unpublished tag is the preview itself; a published one marks what in
  // its list the reader doesn't see (10d, 11e).
  const preview: PagePreview | null =
    tagWithPreview.previewState === null
      ? getListPreview([
          ...articlesWithSources,
          ...articlesWithSources.flatMap((article) => article.categories),
        ])
      : {
          administrationPath: href('/administration/articles/tags/:tagId', {
            tagId: id,
          }),
          entity: 'article_tag',
          kind: 'item',
        }

  return {
    articles: articlesWithSources,
    currentPage,
    pageSize: PAGE_SIZE,
    preview,
    tag: tagWithPreview,
    totalCount,
    totalPages,
  }
}
