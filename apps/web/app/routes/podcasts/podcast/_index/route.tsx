// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import { CoverHeader } from '~/components/cover-header'
import { CoverHeaderBody } from '~/components/cover-header-body'
import { CoverHeaderCover } from '~/components/cover-header-cover'
import { EmptyState } from '~/components/empty-state'
import { EmptyStateLink } from '~/components/empty-state-link'
import { EmptyStateText } from '~/components/empty-state-text'
import { EpisodeNumber } from '~/components/episode-number'
import { Headline } from '~/components/headline'
import { Link } from '~/components/link'
import { LinkArrow } from '~/components/link-arrow'
import { MediaContentLink } from '~/components/media-content-link'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { ParentLink } from '~/components/parent-link'
import { StatusTag } from '~/components/status-tag'
import { Subheadline } from '~/components/subheadline'
import { EPISODE_NOUN } from '~/config/list-noun-config'
import { getParentBreadcrumb } from '~/utils/breadcrumbs'
import { formatListCount } from '~/utils/format-list-count'
import { getPageFlightName } from '~/utils/page-flight/get-page-flight-name'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export default function PodcastPage({
  loaderData,
  matches,
  params,
}: Route.ComponentProps) {
  const { podcast } = loaderData
  const parent = getParentBreadcrumb(matches)

  return (
    <Page alignment={'start'}>
      <CoverHeader>
        {parent && <ParentLink to={parent.path}>{parent.label}</ParentLink>}
        {podcast.cover !== null && (
          <CoverHeaderCover
            alt={podcast.cover.altText}
            flightName={getPageFlightName('podcast-cover', podcast.id)}
            image={podcast.cover.sources}
          />
        )}
        <CoverHeaderBody>
          <Headline>{podcast.title}</Headline>
          {/* Without a published episode, no count (13d). */}
          <Subheadline className={styles.subheadline}>
            {podcast.publishedEpisodeCount === 0
              ? 'Podcast'
              : `Podcast · ${formatListCount(podcast.publishedEpisodeCount, EPISODE_NOUN.countForms)}`}
            {podcast.previewState !== null && (
              <StatusTag muted state={podcast.previewState} />
            )}
          </Subheadline>
          {podcast.description !== '' && (
            <Paragraph className={styles.description}>
              {podcast.description}
            </Paragraph>
          )}
          {/* To this podcast's card on /feeds, where its address is (13b, 17b).
              Only a published podcast has a feed, so a draft preview has none.
              A document load, because a client navigation doesn't move
              :target, which frames the card. */}
          {podcast.previewState === null && (
            <Link
              className={styles.subscribe}
              prefetch={'none'}
              reloadDocument={true}
              to={`${href('/feeds')}#podcast-${params.podcastSlug}`}
            >
              Odebírat epizody ve čtečce
              <LinkArrow />
            </Link>
          )}
        </CoverHeaderBody>
      </CoverHeader>

      {/* Only above a list the page really displays empty, so a draft in
          the editorial preview suppresses it (13d, as 11b). */}
      {podcast.episodes.length === 0 ? (
        <EmptyState>
          <EmptyStateText>
            Z tohoto podcastu jsme zatím nezveřejnili žádnou epizodu.
          </EmptyStateText>
          <EmptyStateLink to={href('/podcasts')}>
            Všechny podcasty
          </EmptyStateLink>
        </EmptyState>
      ) : (
        <ContentList>
          {podcast.episodes.map((episode) => {
            return (
              <ContentListItem key={episode.id}>
                <MediaContentLink
                  isPreview={episode.previewState !== null}
                  to={`/podcasts/${podcast.slug}/${episode.slug}`}
                >
                  <ContentLinkTitle>
                    {episode.number !== null && (
                      <>
                        <EpisodeNumber>{episode.number}</EpisodeNumber>{' '}
                      </>
                    )}
                    {episode.title}
                  </ContentLinkTitle>
                  <ContentLinkFooter>
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
      )}
    </Page>
  )
}

export { loader } from './_loader'
export { meta } from './_meta'
