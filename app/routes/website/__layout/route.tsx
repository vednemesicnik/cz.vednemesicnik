// noinspection JSUnusedGlobalSymbols

import { Outlet } from 'react-router'
import { AppFooter } from '~/components/app-footer'
import { AppHeader } from '~/components/app-header'
import { LayoutContent } from '~/components/layout-content'
import '~/styles/public-semantic-tokens.css'
import './_styles.css'

export default function RouteComponent() {
  return (
    <>
      <AppHeader />
      <LayoutContent>
        <Outlet />
      </LayoutContent>
      <AppFooter />
    </>
  )
}
