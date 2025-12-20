// noinspection JSUnusedGlobalSymbols

import { Outlet } from 'react-router'

import { Breadcrumbs } from '~/components/breadcrumbs'
import { Page } from '~/components/page'
import { getBreadcrumbs } from '~/utils/breadcrumbs'

import type { Route } from './+types/route'

export default function LayoutRouteComponent({
  matches,
}: Route.ComponentProps) {
  const breadcrumbs = getBreadcrumbs(matches)

  return (
    <Page>
      <Breadcrumbs items={breadcrumbs} />
      <Outlet />
    </Page>
  )
}

export { handle } from './_handle'
