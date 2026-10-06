// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { ContentLink } from '~/components/content-link'
import { ContentLinkAuthor } from '~/components/content-link-author'
import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkImage } from '~/components/content-link-image'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import { Heading } from '~/components/heading'
import { Link } from '~/components/link'
import { Page } from '~/components/page'
import { ArticleHero } from '~/components/public/article-hero'
import { Masthead } from '~/components/public/masthead'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { links } from './_links'
export { loader } from './_loader'
export { meta } from './_meta'

// A section without content disappears whole, heading and link included (design 10c).
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { latestArticle, moreArticles } = loaderData

  return (
    <Page>
      <div className={styles.frontPage}>
        <Masthead />

        {latestArticle && (
          <ArticleHero
            authors={latestArticle.authors}
            image={latestArticle.featuredImage?.sources}
            imageAlt={latestArticle.featuredImage?.altText}
            publishDate={latestArticle.publishedAt}
            title={latestArticle.title}
            to={href('/articles/:articleSlug', {
              articleSlug: latestArticle.slug,
            })}
          />
        )}

        {moreArticles.length > 0 && (
          <section className={styles.moreArticles}>
            <Heading className={styles.moreArticlesHeading} level={2}>
              Další články
            </Heading>
            <ContentList className={styles.moreArticlesList}>
              {moreArticles.map((article) => (
                <ContentListItem key={article.id}>
                  <ContentLink
                    to={href('/articles/:articleSlug', {
                      articleSlug: article.slug,
                    })}
                  >
                    <ContentLinkImage
                      alt={article.featuredImage?.altText}
                      image={article.featuredImage?.sources}
                    />
                    <ContentLinkTitle level={3}>
                      {article.title}
                    </ContentLinkTitle>
                    <ContentLinkFooter>
                      <ContentLinkAuthor>
                        {article.authors
                          .map((author) => author.name)
                          .join(', ')}
                      </ContentLinkAuthor>
                      <ContentLinkPublishDate date={article.publishedAt} />
                    </ContentLinkFooter>
                  </ContentLink>
                </ContentListItem>
              ))}
            </ContentList>
            <Link className={styles.allArticles} to={href('/articles')}>
              Všechny články →
            </Link>
          </section>
        )}
      </div>
    </Page>
  )
}
