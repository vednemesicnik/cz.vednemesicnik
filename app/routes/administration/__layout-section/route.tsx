// noinspection JSUnusedGlobalSymbols

import { Outlet } from 'react-router'

import { AdminBoundaryError } from '~/components/admin/admin-boundary-error'
import { AdminBreadcrumbs } from '~/components/admin/admin-breadcrumbs'
import { getBreadcrumbs } from '~/utils/breadcrumbs'

import type { Route } from './+types/route'

export { handle } from './_handle'
export { meta } from './_meta'

export default function LayoutRouteComponent({
  matches,
}: Route.ComponentProps) {
  const breadcrumbs = getBreadcrumbs(matches)

  return (
    <>
      <AdminBreadcrumbs items={breadcrumbs} />
      <Outlet />
    </>
  )
}

// Without breadcrumbs: they come from loader data the failing route didn't deliver.
// The sidebar above stays and is the way on (design 30g).
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <AdminBoundaryError error={error} />
}
