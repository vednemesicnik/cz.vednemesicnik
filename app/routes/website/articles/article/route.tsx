// noinspection JSUnusedGlobalSymbols

import { ContentRenderer } from '~/components/content-renderer'
import { FeaturedImage } from '~/components/featured-image'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Image } from '~/components/image'
import { Page } from '~/components/page'
import { Subheadline } from '~/components/subheadline'
import { Tile } from '~/components/tile'
import { TileGrid } from '~/components/tile-grid'
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
          description={article.featuredImage.description}
          src={createArticleImageUrl(article.featuredImage.id) ?? ''}
        />
      )}

      <ContentRenderer content={article.content} />

      <TileGrid>
        {article.images?.map((image) => (
          <Tile key={image.id} label={image.description || ''}>
            <Image
              alt={image.altText}
              height={165}
              src={createArticleImageUrl(image.id) ?? ''}
              width={220}
            />
          </Tile>
        ))}
      </TileGrid>
    </Page>
  )
}
