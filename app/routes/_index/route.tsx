import { Link, useLoaderData } from "@remix-run/react"

import { ArticleLink } from "~/components/article-link"
import { ArticleLinkAuthor } from "~/components/article-link-author"
import { ArticleLinkFooter } from "~/components/article-link-footer"
import { ArticleLinkImage } from "~/components/article-link-image"
import { ArticleLinkPublishDate } from "~/components/article-link-publish-date"
import { ArticleLinkTitle } from "~/components/article-link-title"
import { FeaturedBanner } from "~/components/featured-banner"
import { Page } from "~/components/page"
import { Tile } from "~/components/tile"
import { sizeConfig } from "~/config/size-config"
import { type loader } from "~/routes/_index/_loader"
import { getArchivedIssueCoverSrc } from "~/utils/get-archived-issue-cover-src"
import { getArchivedIssuePdfSrc } from "~/utils/get-archived-issue-pdf-src"
import { getPodcastCoverSrc } from "~/utils/get-podcast-cover-src"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <Page>
      {loaderData.latestArchivedIssues.map((issue) => {
        const coverAlt = issue.cover?.altText ?? ""
        const coverSrc = getArchivedIssueCoverSrc(issue.cover?.id ?? "")
        const pdfSrc = getArchivedIssuePdfSrc(issue.pdf?.fileName ?? "")

        return (
          <FeaturedBanner
            title={"Nejnovější číslo Vedneměsíčníku"}
            key={issue.id}
          >
            <Link to={pdfSrc} title={issue.label} reloadDocument>
              <Tile
                label={issue.label}
                src={coverSrc}
                alt={coverAlt}
                width={sizeConfig.archivedIssueCover.width}
                height={sizeConfig.archivedIssueCover.height}
              />
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

export { loader } from "./_loader"
export { meta } from "./_meta"
