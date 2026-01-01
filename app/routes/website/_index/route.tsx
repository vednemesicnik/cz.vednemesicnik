// noinspection JSUnusedGlobalSymbols

import { href, Link } from 'react-router'
import { ContentLink } from '~/components/content-link'
import { ContentLinkAuthor } from '~/components/content-link-author'
import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkImage } from '~/components/content-link-image'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { FeaturedBanner } from '~/components/featured-banner'
import { Image } from '~/components/image'
import { Page } from '~/components/page'
import { Tile } from '~/components/tile'
import { sizeConfig } from '~/config/size-config'
import type { Route } from './+types/route'

export { links } from './_links'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { latestArchivedIssues, latestPodcastEpisodes } = loaderData

  return (
    <Page>
      {latestArchivedIssues.map((issue) => {
        const coverAlt = issue.cover?.altText ?? ''
        const coverSrc = href('/resources/issue-cover/:coverId', {
          coverId: issue.cover?.id ?? '',
        })
        const pdfSrc = href('/archive/:fileName', {
          fileName: issue.pdf?.fileName ?? '',
        })

        return (
          <FeaturedBanner
            key={issue.id}
            title={'Nejnovější číslo Vedneměsíčníku'}
          >
            <Link reloadDocument title={issue.label} to={pdfSrc}>
              <Tile label={issue.label}>
                <Image
                  alt={coverAlt}
                  height={sizeConfig.archivedIssueCover.height}
                  src={coverSrc}
                  width={sizeConfig.archivedIssueCover.width}
                />
              </Tile>
            </Link>
          </FeaturedBanner>
        )
      })}

      {latestPodcastEpisodes.map((episode) => {
        const coverAlt = episode.podcast.cover?.altText ?? ''
        const coverSrc = href('/resources/podcast-cover/:coverId', {
          coverId: episode.podcast.cover?.id ?? '',
        })

        return (
          <FeaturedBanner
            key={episode.id}
            title={'Nejnovější podcastová epizoda'}
          >
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
          </FeaturedBanner>
        )
      })}
    </Page>
  )
}
