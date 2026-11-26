import { clsx } from 'clsx'
import { href } from 'react-router'
import { BaseLink } from '~/components/base-link'
import { EmptyState } from '~/components/empty-state'
import { EmptyStateLink } from '~/components/empty-state-link'
import { EmptyStateText } from '~/components/empty-state-text'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { LinkStrip } from '~/components/link-strip'
import { LinkStripLink } from '~/components/link-strip-link'
import { LinkStripLinks } from '~/components/link-strip-links'
import { LinkStripMore } from '~/components/link-strip-more'
import { LinkStripText } from '~/components/link-strip-text'
import { Page } from '~/components/page'
import { ParentLink } from '~/components/parent-link'
import { StatusTag } from '~/components/status-tag'
import { getParentBreadcrumb } from '~/utils/breadcrumbs'
import { showsPublishDate } from '~/utils/content-preview/shows-publish-date'
import { formatArticleCount } from '~/utils/format-article-count'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  matches,
}: Route.ComponentProps) {
  const { categories, tagLinks } = loaderData
  const parent = getParentBreadcrumb(matches)

  return (
    <Page>
      {parent && <ParentLink to={parent.path}>{parent.label}</ParentLink>}
      <HeadlineGroup>
        <Headline>Rubriky</Headline>
      </HeadlineGroup>

      {categories.length > 0 ? (
        <ul className={styles.cards}>
          {categories.map((category) => (
            <li
              className={clsx(
                styles.card,
                category.previewState !== null && styles.cardPreview,
              )}
              key={category.id}
            >
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <BaseLink
                    className={styles.cardTitleLink}
                    to={href('/articles/categories/:slug', {
                      slug: category.slug,
                    })}
                  >
                    {category.name}
                  </BaseLink>
                </h2>
                <span className={styles.cardCount}>
                  {formatArticleCount(category.articleCount)}
                  {category.previewState !== null && (
                    <StatusTag muted state={category.previewState} />
                  )}
                </span>
              </div>
              <ul className={styles.latest}>
                {category.latestArticles.map((article) => (
                  <li
                    className={clsx(
                      styles.latestItem,
                      article.previewState !== null && styles.preview,
                    )}
                    key={article.id}
                  >
                    <BaseLink
                      className={styles.latestTitle}
                      to={href('/articles/:articleSlug', {
                        articleSlug: article.slug,
                      })}
                    >
                      {article.title}
                    </BaseLink>
                    <span className={styles.latestMeta}>
                      {showsPublishDate(article.previewState) &&
                        (article.publishedAt.iso ? (
                          <time
                            className={styles.latestDate}
                            dateTime={article.publishedAt.iso}
                          >
                            {article.publishedAt.formatted}
                          </time>
                        ) : (
                          <span className={styles.latestDate}>
                            {article.publishedAt.formatted}
                          </span>
                        ))}
                      {article.previewState !== null && (
                        <StatusTag muted state={article.previewState} />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>
          <EmptyStateText>
            Rubriky se tu zobrazí, až v nich bude něco ke čtení.
          </EmptyStateText>
          <EmptyStateLink to={href('/articles')}>Všechny články</EmptyStateLink>
        </EmptyState>
      )}

      {tagLinks.length > 0 && (
        <LinkStrip>
          <LinkStripText>Články mají i štítky, třeba</LinkStripText>
          <LinkStripLinks>
            {tagLinks.map((tag) => (
              <LinkStripLink
                isPreview={tag.previewState !== null}
                key={tag.slug}
                to={href('/articles/tags/:slug', { slug: tag.slug })}
              >
                {tag.name}
              </LinkStripLink>
            ))}
          </LinkStripLinks>
          <LinkStripMore to={href('/articles/tags')}>
            Všechny štítky
          </LinkStripMore>
        </LinkStrip>
      )}
    </Page>
  )
}
