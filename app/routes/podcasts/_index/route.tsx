// noinspection JSUnusedGlobalSymbols

import { BaseLink } from '~/components/base-link'
import { ContentLinkAuthor } from '~/components/content-link-author'
import { ContentLinkCover } from '~/components/content-link-cover'
import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Image } from '~/components/image'
import { MediaContentLink } from '~/components/media-content-link'
import { Page } from '~/components/page'
import { Tile } from '~/components/tile'
import { TileGrid } from '~/components/tile-grid'
import { TileGridItem } from '~/components/tile-grid-item'
import { sizeConfig } from '~/config/size-config'
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
          return (
            <TileGridItem key={podcast.id}>
              <BaseLink to={`/podcasts/${podcast.slug}`}>
                <Tile label={podcast.title}>
                  <Image
                    {...podcast.cover.sources}
                    alt={podcast.cover.altText}
                    sizes={`${sizeConfig.podcastCover.width}px`}
                  />
                </Tile>
              </BaseLink>
            </TileGridItem>
          )
        })}
      </TileGrid>

      <ContentList>
        {episodes.map((episode) => {
          const coverAlt = episode.podcast.cover.altText
          const coverSources = episode.podcast.cover.sources

          return (
            <ContentListItem key={episode.id}>
              <MediaContentLink
                to={`/podcasts/${episode.podcast.slug}/${episode.slug}`}
              >
                <ContentLinkCover alt={coverAlt} image={coverSources} />
                <ContentLinkTitle number={episode.number}>
                  {episode.title}
                </ContentLinkTitle>
                <ContentLinkFooter>
                  <ContentLinkAuthor>{episode.podcast.title}</ContentLinkAuthor>
                  <ContentLinkPublishDate date={episode.publishedAt} />
                </ContentLinkFooter>
              </MediaContentLink>
            </ContentListItem>
          )
        })}
      </ContentList>
    </Page>
  )
}

export { loader } from './_loader'
export { meta } from './_meta'
