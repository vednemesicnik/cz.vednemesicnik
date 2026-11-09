import { clsx } from 'clsx'
import { href } from 'react-router'
import { EmptyState } from '~/components/empty-state'
import { EmptyStateLink } from '~/components/empty-state-link'
import { EmptyStateText } from '~/components/empty-state-text'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Link } from '~/components/link'
import { LinkStrip } from '~/components/link-strip'
import { LinkStripMore } from '~/components/link-strip-more'
import { LinkStripText } from '~/components/link-strip-text'
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
  const { hasCategories, tagGroups } = loaderData
  const parent = getParentBreadcrumb(matches)

  return (
    <Page>
      {parent && <ParentLink to={parent.path}>{parent.label}</ParentLink>}
      <HeadlineGroup>
        <Headline>Štítky</Headline>
      </HeadlineGroup>

      {tagGroups.length > 0 ? (
        <ul className={styles.groups}>
          {tagGroups.map((group) => (
            <li className={styles.group} key={group.letter}>
              <span className={styles.letter}>{group.letter}</span>
              <ul className={styles.tags}>
                {group.tags.map((tag) => (
                  <li
                    className={clsx(
                      styles.tag,
                      tag.previewState !== null && styles.preview,
                    )}
                    key={tag.id}
                  >
                    <Link to={href('/articles/tags/:slug', { slug: tag.slug })}>
                      {tag.name}
                    </Link>
                    <span aria-hidden={true} className={styles.count}>
                      {tag.articleCount.toLocaleString('cs-CZ')}
                    </span>
                    <span className={'screen-reader-only'}>
                      {formatArticleCount(tag.articleCount)}
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
            Štítky se tu zobrazí, až pod nimi bude něco ke čtení.
          </EmptyStateText>
          <EmptyStateLink to={href('/articles')}>Všechny články</EmptyStateLink>
        </EmptyState>
      )}

      {hasCategories && (
        <LinkStrip>
          <LinkStripText>Články třídíme i do rubrik.</LinkStripText>
          <LinkStripMore to={href('/articles/categories')}>
            Všechny rubriky
          </LinkStripMore>
        </LinkStrip>
      )}
    </Page>
  )
}
