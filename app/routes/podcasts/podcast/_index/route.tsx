// noinspection JSUnusedGlobalSymbols

import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import { Divider } from '~/components/divider'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { MediaContentLink } from '~/components/media-content-link'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import type { Route } from './+types/route'

export default function PodcastPage({ loaderData }: Route.ComponentProps) {
  const { podcast } = loaderData

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
              <MediaContentLink
                to={`/podcasts/${podcast.slug}/${episode.slug}`}
              >
                <ContentLinkTitle number={episode.number}>
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
    </Page>
  )
}

export { loader } from './_loader'
export { meta } from './_meta'
