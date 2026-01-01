// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { BaseLink } from '~/components/base-link'
import { ContentLink } from '~/components/content-link'
import { ContentLinkAuthor } from '~/components/content-link-author'
import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkImage } from '~/components/content-link-image'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Image } from '~/components/image'
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
          const coverAlt = podcast.cover?.altText ?? ''
          const coverSrc = href('/resources/podcast-cover/:coverId', {
            coverId: podcast.cover?.id ?? '',
          })

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

      <ContentList>
        {episodes.map((episode) => {
          const coverAlt = episode.podcast?.cover?.altText ?? ''
          const coverSrc = href('/resources/podcast-cover/:coverId', {
            coverId: episode.podcast?.cover?.id ?? '',
          })

          return (
            <ContentListItem key={episode.id}>
              <ContentLink
                to={`/podcasts/${episode.podcast.slug}/${episode.slug}`}
              >
                <ContentLinkImage alt={coverAlt} src={coverSrc} />
                <ContentLinkTitle>{episode.title}</ContentLinkTitle>
                <ContentLinkFooter>
                  <ContentLinkAuthor imageAlt={coverAlt} imageSrc={coverSrc}>
                    {episode.podcast.title}
                  </ContentLinkAuthor>
                  <ContentLinkPublishDate date={episode.publishedAt} />
                </ContentLinkFooter>
              </ContentLink>
            </ContentListItem>
          )
        })}
      </ContentList>
    </Page>
  )
}

export { loader } from './_loader'
export { meta } from './_meta'
