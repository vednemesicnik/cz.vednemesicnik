// noinspection JSUnusedGlobalSymbols

import { Outlet } from 'react-router'
import { HoneypotProvider } from 'remix-utils/honeypot/react'

import { AdminHeader } from '~/components/admin-header'
import { AdministrationContent } from '~/components/administration-content'
import { AdministrationFooter } from '~/components/administration-footer'
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
