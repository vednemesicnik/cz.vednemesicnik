// noinspection JSUnusedGlobalSymbols

import { Outlet } from 'react-router'

import { Breadcrumbs } from '~/components/breadcrumbs'
import { getBreadcrumbs } from '~/utils/breadcrumbs'

import type { Route } from './+types/route'

export default function LayoutRouteComponent({
  matches,
}: Route.ComponentProps) {
  const breadcrumbs = getBreadcrumbs(matches)

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <Outlet />
    </>
  )
}

export { handle } from './_handle'
