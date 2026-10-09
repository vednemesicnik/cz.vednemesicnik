import { href } from 'react-router'
import { BaseLink } from '~/components/base-link'
import { EmptyState } from '~/components/empty-state'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { LinkStrip } from '~/components/link-strip'
import { Page } from '~/components/page'
import { ParentLink } from '~/components/parent-link'
import { getParentBreadcrumb } from '~/utils/breadcrumbs'
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
            <li className={styles.card} key={category.id}>
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
                </span>
              </div>
              <ul className={styles.latest}>
                {category.latestArticles.map((article) => (
                  <li className={styles.latestItem} key={article.id}>
                    <BaseLink
                      className={styles.latestTitle}
                      to={href('/articles/:articleSlug', {
                        articleSlug: article.slug,
                      })}
                    >
                      {article.title}
                    </BaseLink>
                    {article.publishedAt.iso ? (
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
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState link={{ label: 'Všechny články', to: href('/articles') }}>
          Rubriky se tu zobrazí, až v nich bude něco ke čtení.
        </EmptyState>
      )}

      {tagLinks.length > 0 && (
        <LinkStrip
          links={tagLinks.map((tag) => ({
            label: tag.name,
            to: href('/articles/tags/:slug', { slug: tag.slug }),
          }))}
          more={{ label: 'Všechny štítky', to: href('/articles/tags') }}
        >
          Články mají i štítky, třeba
        </LinkStrip>
      )}
    </Page>
  )
}
