import { useLoaderData } from "@remix-run/react"

import { ArticleLink } from "app/components/article-link"
import { ArticleLinkImage } from "app/components/article-link-image"
import { ArticleLinkTitle } from "app/components/article-link-title"
import { ArticleList } from "app/components/article-list"
import { ArticleLinkAuthor } from "~/components/article-link-author"
import { ArticleLinkFooter } from "~/components/article-link-footer"
import { ArticleLinkPublishDate } from "~/components/article-link-publish-date"
import { ArticleListItem } from "~/components/article-list-item"
import { Headline } from "~/components/headline"
import { Page } from "~/components/page"
import { Tile, TileImage, TileTitle } from "~/components/tile"
import { TileGrid } from "~/components/tile-grid"
import { type loader } from "~/routes/podcasts._index/_loader"
import { getPodcastCoverSrc } from "~/utils/get-podcast-cover-src"
import { isLast } from "~/utils/is-last"

import styles from "./_styles.module.css"

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
            <Tile key={podcast.id} to={`/podcasts/${podcast.slug}`}>
              <TileImage src={coverSrc} alt={coverAlt} />
              <TileTitle>{podcast.title}</TileTitle>
            </Tile>
          )
        })}
      </TileGrid>

      <ArticleList className={styles.articleList}>
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

export { meta } from "./_meta"
export { loader } from "./_loader"
