// noinspection JSUnusedGlobalSymbols

import { ContentRenderer } from '~/components/content-renderer'
import { FeaturedImage } from '~/components/featured-image'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { ImageGallery } from '~/components/image-gallery'
import { ImageGalleryPreview } from '~/components/image-gallery-preview'
import { Page } from '~/components/page'
import { Subheadline } from '~/components/subheadline'
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
          {article.authors.map((author) => author.name).join(', ')} ·{' '}
          <time dateTime={article.publishedAt.iso ?? undefined}>
            {article.publishedAt.formatted}
          </time>
        </Subheadline>
      </HeadlineGroup>

      {article.featuredImage && (
        <FeaturedImage
          alt={article.featuredImage.altText}
          description={
            <ContentRenderer content={article.featuredImage.description} />
          }
          image={article.featuredImage.sources}
        />
      )}

      <ContentRenderer content={article.content} />

      {article.images && article.images.length > 0 && (
        <ImageGallery>
          {article.images.map((image) => (
            <ImageGalleryPreview
              alt={image.altText}
              description={<ContentRenderer content={image.description} />}
              image={image.sources}
              key={image.id}
            />
          ))}
        </ImageGallery>
      )}
    </Page>
  )
}
