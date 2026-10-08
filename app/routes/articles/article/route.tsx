// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { Badge } from '~/components/badge'
import { BadgeList } from '~/components/badge-list'
import { ContentRenderer } from '~/components/content-renderer'
import { FeaturedImage } from '~/components/featured-image'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { ImageGallery } from '~/components/image-gallery'
import { ImageGalleryPreview } from '~/components/image-gallery-preview'
import { Page } from '~/components/page'
import { ParentLink } from '~/components/parent-link'
import { Subheadline } from '~/components/subheadline'
import { getParentBreadcrumb } from '~/utils/breadcrumbs'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function ArticleRoute({
  loaderData,
  matches,
}: Route.ComponentProps) {
  const { article } = loaderData
  const parent = getParentBreadcrumb(matches)

  return (
    <Page alignment={'start'}>
      {parent && <ParentLink to={parent.path}>{parent.label}</ParentLink>}

      {article.categories.length > 0 && (
        <BadgeList>
          {article.categories.map((category) => (
            <Badge
              key={category.slug}
              to={href('/articles/categories/:slug', {
                slug: category.slug,
              })}
            >
              {category.name}
            </Badge>
          ))}
        </BadgeList>
      )}

      <HeadlineGroup>
        <Headline>{article.title}</Headline>
        <Subheadline>
          {article.authors.map((author) => author.name).join(', ')} ·{' '}
          {article.publishedAt.iso ? (
            <time dateTime={article.publishedAt.iso}>
              {article.publishedAt.formatted}
            </time>
          ) : (
            article.publishedAt.formatted
          )}
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

      <ContentRenderer className={styles.text} content={article.content} />

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

      {article.tags.length > 0 && (
        <footer className={styles.tags}>
          <span className={styles.tagsLabel}>Štítky</span>
          <BadgeList className={styles.tagList}>
            {article.tags.map((tag) => (
              <Badge
                key={tag.slug}
                to={href('/articles/tags/:slug', { slug: tag.slug })}
                variant={'outlined'}
              >
                {tag.name}
              </Badge>
            ))}
          </BadgeList>
        </footer>
      )}
    </Page>
  )
}
