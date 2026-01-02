// noinspection JSUnusedGlobalSymbols

import { ContentRenderer } from '~/components/content-renderer'
import { FeaturedImage } from '~/components/featured-image'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { ImageGallery } from '~/components/image-gallery'
import { ImageGalleryPreview } from '~/components/image-gallery-preview'
import { Page } from '~/components/page'
import { Subheadline } from '~/components/subheadline'
import { createArticleImageUrl } from '~/utils/create-article-image-url'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import type { Route } from './+types/route'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function ArticleRoute({ loaderData }: Route.ComponentProps) {
  const { article } = loaderData

  return (
    <Page>
      <HeadlineGroup>
        <Headline>{article.title}</Headline>
        <Subheadline>
          {article.author.name} · {getFormattedPublishDate(article.publishedAt)}
        </Subheadline>
      </HeadlineGroup>

      {article.featuredImage && (
        <FeaturedImage
          alt={article.featuredImage.altText}
          description={
            <ContentRenderer content={article.featuredImage.description} />
          }
          src={createArticleImageUrl(article.featuredImage.id) ?? ''}
        />
      )}

      <ContentRenderer content={article.content} />

      {article.images && article.images.length > 0 && (
        <ImageGallery>
          {article.images.map((image) => (
            <ImageGalleryPreview
              alt={image.altText}
              description={<ContentRenderer content={image.description} />}
              key={image.id}
              src={createArticleImageUrl(image.id) ?? ''}
            />
          ))}
        </ImageGallery>
      )}
    </Page>
  )
}
