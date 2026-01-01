// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { ContentLink } from '~/components/content-link'
import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkImage } from '~/components/content-link-image'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export default function PodcastPage({ loaderData }: Route.ComponentProps) {
  const { podcast } = loaderData

  const podcastCoverAlt = podcast.cover?.altText ?? ''
  const podcastCoverSrc = href('/resources/podcast-cover/:coverId', {
    coverId: podcast.cover?.id ?? '',
  })

  return (
    <Page>
      <HeadlineGroup>
        <Headline>{podcast.title}</Headline>
      </HeadlineGroup>
      <Paragraph>{podcast.description}</Paragraph>

      <ContentList className={styles.articleList}>
        {podcast.episodes.map((episode) => {
          return (
            <ContentListItem key={episode.id}>
              <ContentLink to={`/podcasts/${podcast.slug}/${episode.slug}`}>
                <ContentLinkImage alt={podcastCoverAlt} src={podcastCoverSrc} />
                <ContentLinkTitle>{`#${episode.number} ${episode.title}`}</ContentLinkTitle>
                <ContentLinkFooter>
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
