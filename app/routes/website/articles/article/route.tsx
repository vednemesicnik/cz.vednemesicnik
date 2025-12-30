// noinspection JSUnusedGlobalSymbols

import { ContentRenderer } from '~/components/content-renderer'
import { Image } from '~/components/image'
import { Tile } from '~/components/tile'
import { TileGrid } from '~/components/tile-grid'
import { createArticleImageUrl } from '~/utils/create-article-image-url'

import type { Route } from './+types/route'

export { loader } from './_loader'
export { meta } from './_meta'

export default function ArticleRoute({ loaderData }: Route.ComponentProps) {
  const { article } = loaderData

  // Filter out featured image from gallery
  const galleryImages = article.images.filter(
    (image) => image.id !== article.featuredImage?.id,
  )

  return (
    <article>
      {article.featuredImage && (
        <Image
          alt={article.featuredImage.altText}
          height={705}
          src={createArticleImageUrl(article.featuredImage.id) ?? ''}
          width={940}
        />
      )}

      <ContentRenderer content={article.content} />

      <TileGrid>
        {galleryImages?.map((image) => (
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
    </article>
  )
}
