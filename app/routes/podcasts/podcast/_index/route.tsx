// noinspection JSUnusedGlobalSymbols

import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkImage } from '~/components/content-link-image'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import { Divider } from '~/components/divider'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { PostContentLink } from '~/components/post-content-link'
import type { Route } from './+types/route'

export default function PodcastPage({ loaderData }: Route.ComponentProps) {
  const { podcast } = loaderData

  const podcastCoverAlt = podcast.cover.altText
  const podcastCoverSources = podcast.cover.sources

  return (
    <Page>
      <HeadlineGroup>
        <Headline>{podcast.title}</Headline>
      </HeadlineGroup>
      <Paragraph>{podcast.description}</Paragraph>

      <Divider variant={'secondary'} />

      <ContentList>
        {podcast.episodes.map((episode) => {
          return (
            <ContentListItem key={episode.id}>
              <PostContentLink to={`/podcasts/${podcast.slug}/${episode.slug}`}>
                <ContentLinkImage
                  alt={podcastCoverAlt}
                  image={podcastCoverSources}
                  shape={'square'}
                />
                <ContentLinkTitle number={episode.number}>
                  {episode.title}
                </ContentLinkTitle>
                <ContentLinkFooter>
                  <ContentLinkPublishDate date={episode.publishedAt} />
                </ContentLinkFooter>
              </PostContentLink>
            </ContentListItem>
          )
        })}
      </ContentList>
    </Page>
  )
}

export { loader } from './_loader'
export { meta } from './_meta'
