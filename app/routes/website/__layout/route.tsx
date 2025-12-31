// noinspection JSUnusedGlobalSymbols

import { Outlet } from 'react-router'

import { AppBody } from '~/components/app-body'
import { AppFooter } from '~/components/app-footer'
import { AppHeader } from '~/components/app-header'
import '~/styles/design-tokens.css'
import './_styles.css'

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
