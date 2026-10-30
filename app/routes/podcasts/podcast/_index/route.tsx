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
import { Headline } from '~/components/headline'
import { MediaContentLink } from '~/components/media-content-link'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { ParentLink } from '~/components/parent-link'
import { Subheadline } from '~/components/subheadline'
import { EPISODE_NOUN } from '~/config/list-noun-config'
import { getParentBreadcrumb } from '~/utils/breadcrumbs'
import { formatListCount } from '~/utils/format-list-count'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export default function PodcastPage({
  loaderData,
  matches,
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
            image={podcast.cover.sources}
          />
        )}
        <CoverHeaderBody>
          <Headline>{podcast.title}</Headline>
          {/* Without a published episode, no count (13d). */}
          <Subheadline>
            {podcast.publishedEpisodeCount === 0
              ? 'Podcast'
              : `Podcast · ${formatListCount(podcast.publishedEpisodeCount, EPISODE_NOUN.countForms)}`}
          </Subheadline>
          {podcast.description !== '' && (
            <Paragraph className={styles.description}>
              {podcast.description}
            </Paragraph>
          )}
        </CoverHeaderBody>
      </CoverHeader>

      {/* Only above a list the page really displays empty, so a draft in
          the editorial preview suppresses it (13d, as 11b). */}
      {podcast.episodes.length === 0 ? (
        <EmptyState link={{ label: 'Všechny podcasty', to: href('/podcasts') }}>
          Z tohoto podcastu jsme zatím nezveřejnili žádnou epizodu.
        </EmptyState>
      ) : (
        <ContentList>
          {podcast.episodes.map((episode) => {
            return (
              <ContentListItem key={episode.id}>
                <MediaContentLink
                  to={`/podcasts/${podcast.slug}/${episode.slug}`}
                >
                  <ContentLinkTitle number={episode.number ?? undefined}>
                    {episode.title}
                  </ContentLinkTitle>
                  <ContentLinkFooter>
                    <ContentLinkPublishDate date={episode.publishedAt} />
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
