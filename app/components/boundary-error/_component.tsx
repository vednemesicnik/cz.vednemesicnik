import { clsx } from 'clsx'
import { useLocation } from 'react-router'

import { BaseLink } from '~/components/base-link'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Link } from '~/components/link'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'

import styles from './_styles.module.css'
import { BoundaryDiagnostics } from './components/boundary-diagnostics'
import { type ContentKind, getWebsiteContentKind } from './utils/content-kind'
import { resolveWebsiteBoundary } from './utils/resolve-boundary'

type Props = {
  error: unknown
  kind?: ContentKind | null
}

/**
 * Website error boundary content (design 30f, 30g), rendered inside the website layout.
 *
 * @param error - The error handed to the route's `ErrorBoundary`.
 * @param kind - Overrides the content kind derived from the address; `null` forces
 *   the generic 404 page.
 */
export const BoundaryError = ({ error, kind }: Props) => {
  const { pathname, search } = useLocation()
  const view = resolveWebsiteBoundary(
    error,
    kind === undefined ? getWebsiteContentKind(pathname) : kind,
    pathname + search,
  )

  return (
    <Page>
      <HeadlineGroup>
        <Headline>{view.title}</Headline>
      </HeadlineGroup>
      <Paragraph>{view.sentence}</Paragraph>
      {view.unexpected && (
        <BoundaryDiagnostics className={styles.diagnostics} error={error} />
      )}

      <div className={styles.actions}>
        {view.actions.map((action, index) => (
          <BaseLink
            className={clsx(
              styles.action,
              index === 0 ? styles.primary : styles.secondary,
            )}
            key={action.label}
            reloadDocument={action.reload}
            to={action.href}
          >
            {action.label}
          </BaseLink>
        ))}
      </div>

      {view.links !== undefined && (
        <nav className={styles.links}>
          {view.links.map((link) => (
            <Link key={link.label} to={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </Page>
  )
}
