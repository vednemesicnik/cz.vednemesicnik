// noinspection JSUnusedGlobalSymbols

import { Outlet } from 'react-router'
import { BreadcrumbNavigation } from '~/components/breadcrumb-navigation'
import { getBreadcrumbs } from '~/utils/breadcrumbs'
import type { Route } from './+types/route'

export { handle } from './_handle'

export default function LayoutRouteComponent({
  matches,
}: Route.ComponentProps) {
  const breadcrumbs = getBreadcrumbs(matches)

  return (
    <>
      <BreadcrumbNavigation items={breadcrumbs} />
      <Outlet />
    </>
  )
}
