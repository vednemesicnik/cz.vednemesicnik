// noinspection JSUnusedGlobalSymbols

import { Link } from "react-router"

import { ArticleLink } from "~/components/article-link"
import { ArticleLinkAuthor } from "~/components/article-link-author"
import { ArticleLinkFooter } from "~/components/article-link-footer"
import { ArticleLinkImage } from "~/components/article-link-image"
import { ArticleLinkPublishDate } from "~/components/article-link-publish-date"
import { ArticleLinkTitle } from "~/components/article-link-title"
import { FeaturedBanner } from "~/components/featured-banner"
import { Image } from "~/components/image"
import { Page } from "~/components/page"
import { Tile } from "~/components/tile"
import { sizeConfig } from "~/config/size-config"
import { getIssueCoverSrc } from "~/utils/get-issue-cover-src"
import { getIssuePdfSrc } from "~/utils/get-issue-pdf-src"
import { getPodcastCoverSrc } from "~/utils/get-podcast-cover-src"

import type { Route } from "./+types/route"

export { links } from "./_links"
export { loader } from "./_loader"
export { meta } from "./_meta"

export default function Route({ loaderData }: Route.ComponentProps) {
  return (
    <Page>
      {loaderData.latestArchivedIssues.map((issue) => {
        const coverAlt = issue.cover?.altText ?? ""
        const coverSrc = getIssueCoverSrc(issue.cover?.id ?? "")
        const pdfSrc = getIssuePdfSrc(issue.pdf?.fileName ?? "")

        return (
          <FeaturedBanner
            title={"Nejnovější číslo Vedneměsíčníku"}
            key={issue.id}
          >
            <Link to={pdfSrc} title={issue.label} reloadDocument>
              <Tile label={issue.label}>
                <Image
                  src={coverSrc}
                  alt={coverAlt}
                  width={sizeConfig.archivedIssueCover.width}
                  height={sizeConfig.archivedIssueCover.height}
                />
              </Tile>
            </Link>
          </FeaturedBanner>
        )
      })}

      {loaderData.latestPodcastEpisodes.map((episode) => {
        const coverAlt = episode.podcast.cover?.altText ?? ""
        const coverSrc = getPodcastCoverSrc(episode.podcast.cover?.id ?? "")

        return (
          <FeaturedBanner
            key={episode.id}
            title={"Nejnovější podcastová epizoda"}
          >
            <ArticleLink
              to={`/podcasts/${episode.podcast.slug}/${episode.slug}`}
            >
              <ArticleLinkImage alt={coverAlt} src={coverSrc} />
              <ArticleLinkTitle>{episode.title}</ArticleLinkTitle>
              <ArticleLinkFooter>
                <ArticleLinkAuthor imageSrc={coverSrc} imageAlt={coverAlt}>
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
