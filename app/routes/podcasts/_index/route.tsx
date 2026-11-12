// noinspection JSUnusedGlobalSymbols

import { BaseLink } from '~/components/base-link'
import { ContentLinkAuthor } from '~/components/content-link-author'
import { ContentLinkCover } from '~/components/content-link-cover'
import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import { EpisodeNumber } from '~/components/episode-number'
import { Heading } from '~/components/heading'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Image } from '~/components/image'
import { MediaContentLink } from '~/components/media-content-link'
import { Page } from '~/components/page'
import { PageFlight } from '~/components/page-flight'
import { StatusTag } from '~/components/status-tag'
import { Tile } from '~/components/tile'
import { TileCaption } from '~/components/tile-caption'
import { TileCard } from '~/components/tile-card'
import { TileGrid } from '~/components/tile-grid'
import { TileGridItem } from '~/components/tile-grid-item'
import { sizeConfig } from '~/config/size-config'
import { getPageFlightName } from '~/utils/page-flight/get-page-flight-name'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { podcasts, episodes } = loaderData

  return (
    <Page>
      <HeadlineGroup>
        <Headline>Tohle si poslechněte</Headline>
      </HeadlineGroup>

      {podcasts.length > 0 && (
        <section className={styles.section}>
          <Heading level={2}>Podcasty</Heading>
          <TileGrid>
            {podcasts.map((podcast) => {
              // The cover flies into the podcast's header; the tile's frame
              // and shadow stay on the list (18c).
              const flightName =
                podcast.cover === null
                  ? undefined
                  : getPageFlightName('podcast-cover', podcast.id)

              return (
                <TileGridItem key={podcast.id}>
                  <BaseLink
                    data-page-flight={flightName}
                    data-page-flight-kind={flightName && 'tile'}
                    to={`/podcasts/${podcast.slug}`}
                  >
                    <Tile isPreview={podcast.previewState !== null}>
                      <TileCard>
                        {podcast.cover !== null && (
                          <PageFlight kind={'tile'} name={flightName}>
                            <Image
                              {...podcast.cover.sources}
                              alt={podcast.cover.altText}
                              sizes={`${sizeConfig.podcastCover.width}px`}
                            />
                          </PageFlight>
                        )}
                      </TileCard>
                      <TileCaption>
                        {podcast.title}
                        {podcast.previewState !== null && (
                          <StatusTag muted state={podcast.previewState} />
                        )}
                      </TileCaption>
                    </Tile>
                  </BaseLink>
                </TileGridItem>
              )
            })}
          </TileGrid>
        </section>
      )}

      {episodes.length > 0 && (
        <section className={styles.section}>
          <Heading level={2}>Nejnovější epizody</Heading>
          <ContentList>
            {episodes.map((episode) => {
              const coverAlt = episode.cover?.altText
              const coverSources = episode.cover?.sources

              return (
                <ContentListItem key={episode.id}>
                  <MediaContentLink
                    isPreview={episode.isPreview}
                    to={`/podcasts/${episode.podcast.slug}/${episode.slug}`}
                  >
                    <ContentLinkCover
                      alt={coverAlt}
                      flightName={getPageFlightName(
                        'episode-cover',
                        episode.id,
                      )}
                      image={coverSources}
                    />
                    <ContentLinkTitle level={3}>
                      {episode.number !== null && (
                        <>
                          <EpisodeNumber>{episode.number}</EpisodeNumber>{' '}
                        </>
                      )}
                      {episode.title}
                    </ContentLinkTitle>
                    <ContentLinkFooter>
                      <ContentLinkAuthor>
                        {episode.podcast.title}
                      </ContentLinkAuthor>
                      <ContentLinkPublishDate
                        date={episode.publishedAt}
                        previewState={episode.previewState}
                      />
                    </ContentLinkFooter>
                  </MediaContentLink>
                </ContentListItem>
              )
            })}
          </ContentList>
        </section>
      )}
    </Page>
  )
}

export { loader } from './_loader'
export { meta } from './_meta'
