import { buildVisibleArticleWhere } from '~/routes/articles/utils/build-visible-article-where'
import { findArticlesDraftsFirst } from '~/routes/articles/utils/find-articles-drafts-first.server'
import { getListPreview } from '~/utils/content-preview/get-list-preview'
import { getWebPreviewState } from '~/utils/content-preview/get-web-preview-state'
import { WEB_PREVIEW_STATE_SELECT } from '~/utils/content-preview/web-preview-state-select'
import { createFormattedDate } from '~/utils/format-date'
import { hasSlug } from '~/utils/has-slug'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getWebContentVisibility } from '~/utils/permissions/author/get-web-content-visibility.server'
import type { Route } from './+types/route'

const articleSelect = {
  ...WEB_PREVIEW_STATE_SELECT,
  authors: {
    select: {
      name: true,
    },
  },
  featuredImage: {
    select: imageSourceSelect,
  },
  id: true,
  publishedAt: true,
  slug: true,
  title: true,
} as const

export const loader = async ({ request }: Route.LoaderArgs) => {
  const visibility = await getWebContentVisibility(request, ['article'])

  // The latest article and five more (design 10a); a draft stands first, so
  // the newest becomes the main article as it will once published (10d).
  const articles = await findArticlesDraftsFirst({
    select: articleSelect,
    skip: 0,
    take: 6,
    where: buildVisibleArticleWhere(visibility),
  })

  const articlesWithSources = articles
    .filter(hasSlug)
    .map(({ reviews, state, submittedAt, ...article }) => ({
      ...article,
      featuredImage: article.featuredImage
        ? {
            altText: article.featuredImage.altText,
            sources: createImageSources('article-image', article.featuredImage),
          }
        : null,
      previewState: getWebPreviewState({ reviews, state, submittedAt }),
      publishedAt: createFormattedDate(article.publishedAt),
    }))

  return {
    latestArticle: articlesWithSources[0] ?? null,
    moreArticles: articlesWithSources.slice(1),
    preview: getListPreview(articlesWithSources),
  }
}
