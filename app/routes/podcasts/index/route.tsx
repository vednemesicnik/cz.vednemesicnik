// noinspection JSUnusedGlobalSymbols

import { Link } from "react-router"

import { ArticleLink } from "~/components/article-link"
import { ArticleLinkAuthor } from "~/components/article-link-author"
import { ArticleLinkFooter } from "~/components/article-link-footer"
import { ArticleLinkImage } from "~/components/article-link-image"
import { ArticleLinkPublishDate } from "~/components/article-link-publish-date"
import { ArticleLinkTitle } from "~/components/article-link-title"
import { ArticleList } from "~/components/article-list"
import { ArticleListItem } from "~/components/article-list-item"
import { Headline } from "~/components/headline"
import { Image } from "~/components/image"
import { Tile } from "~/components/tile"
import { TileGrid } from "~/components/tile-grid"
import { TileGridItem } from "~/components/tile-grid-item"
import { sizeConfig } from "~/config/size-config"
import { getPodcastCoverSrc } from "~/utils/get-podcast-cover-src"
import { isLast } from "~/utils/is-last"

import type { Route } from "./+types/route"

export default function Route({ loaderData }: Route.ComponentProps) {
  const { podcasts, episodes } = loaderData

  return (
    <>
      <Headline>Tohle si poslechněte</Headline>

      <TileGrid>
        {podcasts.map((podcast) => {
          const coverAlt = podcast.cover?.altText ?? ""
          const coverSrc = getPodcastCoverSrc(podcast.cover?.id ?? "")

          return (
            <TileGridItem key={podcast.id}>
              <Link to={`/podcasts/${podcast.slug}`}>
                <Tile label={podcast.title}>
                  <Image
                    src={coverSrc}
                    alt={coverAlt}
                    width={sizeConfig.podcastCover.width}
                    height={sizeConfig.podcastCover.height}
                  />
                </Tile>
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
    </>
  )
}

export { loader } from "./_loader"
export { meta } from "./_meta"
