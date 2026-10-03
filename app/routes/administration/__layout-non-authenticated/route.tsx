// noinspection JSUnusedGlobalSymbols

import { Outlet } from 'react-router'
import { AdminHeader } from '~/components/admin/admin-header'
import { AdministrationContent } from '~/components/admin/administration-content'
import { AdministrationFooter } from '~/components/admin/administration-footer'
import { HoneypotProvider } from '~/components/honeypot-provider'
import { RootBoundaryError } from '~/components/root-boundary-error'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { loader } from './_loader'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <HoneypotProvider {...loaderData.honeypotInputProps}>
      <div className={styles.layout}>
        <AdminHeader />
        <AdministrationContent className={styles.page}>
          <Outlet />
        </AdministrationContent>
        <AdministrationFooter />
      </div>
    </HoneypotProvider>
  )
}

// The layout's own loader failed, so nothing it provides can render (design 30g, root).
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RootBoundaryError error={error} />
}
