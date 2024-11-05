import { Link, useLoaderData } from "@remix-run/react"

import { ArticleLink } from "~/components/article-link"
import { ArticleLinkAuthor } from "~/components/article-link-author"
import { ArticleLinkFooter } from "~/components/article-link-footer"
import { ArticleLinkImage } from "~/components/article-link-image"
import { ArticleLinkPublishDate } from "~/components/article-link-publish-date"
import { ArticleLinkTitle } from "~/components/article-link-title"
import { ArticleList } from "~/components/article-list"
import { ArticleListItem } from "~/components/article-list-item"
import { Headline } from "~/components/headline"
import { Page } from "~/components/page"
import { Tile } from "~/components/tile"
import { TileGrid } from "~/components/tile-grid"
import { TileGridItem } from "~/components/tile-grid-item"
import { sizeConfig } from "~/config/size-config"
import { type loader } from "~/routes/podcasts._index/_loader"
import { getPodcastCoverSrc } from "~/utils/get-podcast-cover-src"
import { isLast } from "~/utils/is-last"

export default function Podcasts() {
  const { podcasts, episodes } = useLoaderData<typeof loader>()

  return (
    <Page>
      <Headline>Podcasty</Headline>

      <TileGrid>
        {podcasts.map((podcast) => {
          const coverAlt = podcast.cover?.altText ?? ""
          const coverSrc = getPodcastCoverSrc(podcast.cover?.id ?? "")

          return (
            <TileGridItem key={podcast.id}>
              <Link to={`/podcasts/${podcast.slug}`}>
                <Tile
                  label={podcast.title}
                  width={sizeConfig.podcastCover.width}
                  height={sizeConfig.podcastCover.height}
                  placeholderWidth={sizeConfig.podcastCover.placeholderWidth}
                  placeholderHeight={sizeConfig.podcastCover.placeholderHeight}
                  src={coverSrc}
                  alt={coverAlt}
                />
              </Link>
            </TileGridItem>
          )
        })}
      </TileGrid>

      <ArticleList>
        {episodes.map((episode, index) => {
          const coverAlt = episode.podcast?.cover?.altText ?? ""
          const coverSrc = getPodcastCoverSrc(episode.podcast?.cover?.id ?? "")

          return (
            <ArticleListItem
              key={episode.id}
              isLast={isLast(index, episodes.length)}
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
            </ArticleListItem>
          )
        })}
      </ArticleList>
    </Page>
  )
}

export { loader } from "./_loader"
export { meta } from "./_meta"
