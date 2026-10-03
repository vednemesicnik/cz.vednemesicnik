// noinspection JSUnusedGlobalSymbols

import { Outlet } from 'react-router'
import { AppBody } from '~/components/app-body'
import { AppFooter } from '~/components/app-footer'
import { AppHeader } from '~/components/app-header'
import { BoundaryError } from '~/components/boundary-error'
import type { Route } from './+types/route'
import './_styles.css'

export { meta } from './_meta'

export default function RouteComponent() {
  return (
    <>
      <AppHeader />
      <AppBody>
        <Outlet />
      </AppBody>
      <AppFooter />
    </>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <>
      <AppHeader />
      <AppBody>
        <BoundaryError error={error} />
      </AppBody>
      <AppFooter />
    </>
  )
}
