import { useLoaderData } from "@remix-run/react"

import { ArticleLinkImage } from "app/components/article-link-image"
import { ArticleLinkPublishDate } from "app/components/article-link-publish-date"
import { ArticleLinkTitle } from "app/components/article-link-title"
import { Headline } from "app/components/headline"
import { ArticleLink } from "~/components/article-link"
import { ArticleLinkFooter } from "~/components/article-link-footer"
import { ArticleList } from "~/components/article-list"
import { ArticleListItem } from "~/components/article-list-item"
import { Page } from "~/components/page"
import { Paragraph } from "~/components/paragraph"
import { type loader } from "~/routes/podcasts.$podcastSlug._index/_loader"
import { getPodcastCoverSrc } from "~/utils/get-podcast-cover-src"
import { isLast } from "~/utils/is-last"

import styles from "./_styles.module.css"

export default function PodcastPage() {
  const { podcast } = useLoaderData<typeof loader>()

  const podcastCoverAlt = podcast.cover?.altText ?? ""
  const podcastCoverSrc = getPodcastCoverSrc(podcast.cover?.id ?? "")

  return (
    <Page>
      <Headline>{podcast.title}</Headline>
      <Paragraph>{podcast.description}</Paragraph>

      <ArticleList className={styles.articleList}>
        {podcast.episodes.map((episode, index) => {
          return (
            <ArticleListItem
              key={episode.id}
              isLast={isLast(index, podcast.episodes.length)}
            >
              <ArticleLink to={`/podcasts/${podcast.slug}/${episode.slug}`}>
                <ArticleLinkImage alt={podcastCoverAlt} src={podcastCoverSrc} />
                <ArticleLinkTitle>{`#${episode.number} ${episode.title}`}</ArticleLinkTitle>
                <ArticleLinkFooter>
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
