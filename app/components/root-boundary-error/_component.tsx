import { useLocation } from 'react-router'

import { BaseLink } from '~/components/base-link'
import { BoundaryDiagnostics } from '~/components/boundary-error/components/boundary-diagnostics'
import { getPageLoadFailedCopy } from '~/components/boundary-error/utils/boundary-copy'
import { VdmLogo } from '~/components/vdm-logo'

import styles from './_styles.module.css'

type Props = {
  error: unknown
}

/**
 * Root error boundary content (design 30g): only for a failure of a layout itself.
 * Depends on nothing a failing layout might have provided — no loader data, only
 * global styles and the logo — and renders the same copy for every status.
 *
 * @param error - The error handed to the root `ErrorBoundary`.
 */
export const RootBoundaryError = ({ error }: Props) => {
  const { pathname, search } = useLocation()
  const copy = getPageLoadFailedCopy(pathname + search)
  const isAdministration = pathname.startsWith('/administration')

  return (
    <main className={styles.container}>
      <VdmLogo
        className={styles.logo}
        variant={isAdministration ? 'admin' : 'default'}
      />
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.sentence}>{copy.sentence}</p>
      <BoundaryDiagnostics error={error} />

      {copy.actions.map((action) => (
        <BaseLink
          className={styles.action}
          key={action.label}
          reloadDocument={action.reload}
          to={action.href}
        >
          {action.label}
        </BaseLink>
      ))}
    </main>
  )
}
