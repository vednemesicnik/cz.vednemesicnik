// noinspection JSUnusedGlobalSymbols

import { Outlet } from 'react-router'

import { AdminBoundaryError } from '~/components/admin/admin-boundary-error'
import { AdminBreadcrumbs } from '~/components/admin/admin-breadcrumbs'
import { getAdminBreadcrumbs } from '~/utils/get-admin-breadcrumbs'

import type { Route } from './+types/route'

export { meta } from './_meta'

export default function LayoutRouteComponent({
  matches,
}: Route.ComponentProps) {
  // Only on a record, from its section (design 22a, 23a).
  const breadcrumbs = getAdminBreadcrumbs(matches)

  return (
    <>
      {breadcrumbs.length > 0 && <AdminBreadcrumbs items={breadcrumbs} />}
      <Outlet />
    </>
  )
}

// Without breadcrumbs: they come from loader data the failing route didn't deliver.
// The sidebar above stays and is the way on (design 30g).
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <AdminBoundaryError error={error} />
}
