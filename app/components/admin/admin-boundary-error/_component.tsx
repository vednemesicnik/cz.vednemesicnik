import { useLocation } from 'react-router'

import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { useHighlightSidebarSection } from '~/components/admin/sidebar-highlight-provider'
import { BoundaryDiagnostics } from '~/components/boundary-error/components/boundary-diagnostics'
import type { ContentKind } from '~/components/boundary-error/utils/content-kind'
import { LinkButton } from '~/components/link-button'

import styles from './_styles.module.css'
import { resolveAdminBoundaryView } from './utils/resolve-admin-boundary-view'

type Props = {
  error: unknown
  kind?: ContentKind | null
}

/**
 * Administration error boundary content (design 30d, 30e, 30g, 30h), rendered inside
 * the administration frame.
 *
 * @param error - The error handed to the route's `ErrorBoundary`.
 * @param kind - Overrides the record kind derived from the address; `null` renders
 *   a 404 as an address that doesn't exist.
 */
export const AdminBoundaryError = ({ error, kind }: Props) => {
  const location = useLocation()
  const view = resolveAdminBoundaryView(error, location, kind)

  useHighlightSidebarSection(view.highlightsSection)

  return (
    <AdminPage>
      <AdminHeadline>{view.title}</AdminHeadline>
      <AdminParagraph>{view.sentence}</AdminParagraph>
      {view.unexpected && <BoundaryDiagnostics error={error} />}

      <div className={styles.actions}>
        {/* The first action is primary, the rest ghost (30d–30h). */}
        {view.actions.map((action, index) => (
          <LinkButton
            key={action.label}
            reloadDocument={action.reload}
            to={action.href}
            variant={index === 0 ? 'primary' : 'ghost'}
          >
            {action.label}
          </LinkButton>
        ))}
      </div>
    </AdminPage>
  )
}
