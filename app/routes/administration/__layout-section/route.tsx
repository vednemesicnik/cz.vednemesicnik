// noinspection JSUnusedGlobalSymbols

import { Outlet } from 'react-router'

import { AdminBreadcrumbs } from '~/components/admin-breadcrumbs'
import { getBreadcrumbs } from '~/utils/breadcrumbs'

import type { Route } from './+types/route'

export { handle } from './_handle'

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
