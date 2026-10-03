import { useLocation } from 'react-router'

import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { useHighlightSidebarSection } from '~/components/admin/sidebar-highlight-provider'
import { BoundaryDiagnostics } from '~/components/boundary-error/components/boundary-diagnostics'
import type { ContentKind } from '~/components/boundary-error/utils/content-kind'

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
        {view.actions.map((action) => (
          <AdminLinkButton
            key={action.label}
            reloadDocument={action.reload}
            to={action.href}
          >
            {action.label}
          </AdminLinkButton>
        ))}
      </div>
    </AdminPage>
  )
}
