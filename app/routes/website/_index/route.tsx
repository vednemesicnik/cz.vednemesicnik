// noinspection JSUnusedGlobalSymbols

import { href, Link } from 'react-router'
import { ArticleLink } from '~/components/article-link'
import { ArticleLinkAuthor } from '~/components/article-link-author'
import { ArticleLinkFooter } from '~/components/article-link-footer'
import { ArticleLinkImage } from '~/components/article-link-image'
import { ArticleLinkPublishDate } from '~/components/article-link-publish-date'
import { ArticleLinkTitle } from '~/components/article-link-title'
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
          </FeaturedBanner>
        )
      })}
    </Page>
  )
}
