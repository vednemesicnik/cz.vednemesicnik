import { ArticleLink } from '~/components/article-link'
import { ArticleLinkAuthor } from '~/components/article-link-author'
import { ArticleLinkFooter } from '~/components/article-link-footer'
import { ArticleLinkImage } from '~/components/article-link-image'
import { ArticleLinkPublishDate } from '~/components/article-link-publish-date'
import { ArticleLinkTitle } from '~/components/article-link-title'
import { ArticleList } from '~/components/article-list'
import { ArticleListItem } from '~/components/article-list-item'
import { BaseLink } from '~/components/base-link'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Image } from '~/components/image'
import { Page } from '~/components/page'
import { Tile } from '~/components/tile'
import { TileGrid } from '~/components/tile-grid'
import { TileGridItem } from '~/components/tile-grid-item'
import { sizeConfig } from '~/config/size-config'
import { getPodcastCoverSrc } from '~/utils/get-podcast-cover-src'
import { isLast } from '~/utils/is-last'
import type { Route } from './+types/route'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { podcasts, episodes } = loaderData

  return (
    <Page>
      <HeadlineGroup>
        <Headline>Tohle si poslechněte</Headline>
      </HeadlineGroup>

      <TileGrid>
        {podcasts.map((podcast) => {
          const coverAlt = podcast.cover?.altText ?? ''
          const coverSrc = getPodcastCoverSrc(podcast.cover?.id ?? '')

          return (
            <TileGridItem key={podcast.id}>
              <BaseLink to={`/podcasts/${podcast.slug}`}>
                <Tile label={podcast.title}>
                  <Image
                    alt={coverAlt}
                    height={sizeConfig.podcastCover.height}
                    src={coverSrc}
                    width={sizeConfig.podcastCover.width}
                  />
                </Tile>
              </BaseLink>
            </TileGridItem>
          )
        })}
      </TileGrid>

      <ArticleList>
        {episodes.map((episode, index) => {
          const coverAlt = episode.podcast?.cover?.altText ?? ''
          const coverSrc = getPodcastCoverSrc(episode.podcast?.cover?.id ?? '')

          return (
            <ArticleListItem
              isLast={isLast(index, episodes.length)}
              key={episode.id}
            >
              <ArticleLink
                to={`/podcasts/${episode.podcast.slug}/${episode.slug}`}
              >
                <ArticleLinkImage alt={coverAlt} src={coverSrc} />
                <ArticleLinkTitle>{episode.title}</ArticleLinkTitle>
                <ArticleLinkFooter>
                  <ArticleLinkAuthor imageAlt={coverAlt} imageSrc={coverSrc}>
                    {episode.podcast.title}
                  </ArticleLinkAuthor>
                  <ArticleLinkPublishDate date={episode.publishedAt} />
                </ArticleLinkFooter>
              </ArticleLink>
            </ArticleListItem>
          )
        })}
      </ArticleList>
    </Page>
  )
}

export { loader } from './_loader'
export { meta } from './_meta'
