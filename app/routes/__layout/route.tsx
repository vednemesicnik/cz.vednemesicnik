// noinspection JSUnusedGlobalSymbols

import { Outlet, useRouteLoaderData } from 'react-router'
import { AppBody } from '~/components/app-body'
import { AppFooter } from '~/components/app-footer'
import { AppHeader } from '~/components/app-header'
import { BoundaryError } from '~/components/boundary-error'
import type { loader } from './_loader'
import type { Route } from './+types/route'
import { SitePreviewBar } from './components/site-preview-bar'
import './_styles.css'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <AppHeader>
        <SitePreviewBar previewMode={loaderData.previewMode} />
      </AppHeader>
      <AppBody>
        <Outlet />
      </AppBody>
      <AppFooter />
    </>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  // The reader view's bar stays on a 404 too, so the preview can come back.
  const layoutData = useRouteLoaderData<typeof loader>('routes/__layout/route')

  return (
    <>
      <AppHeader>
        <SitePreviewBar previewMode={layoutData?.previewMode ?? null} />
      </AppHeader>
      <AppBody>
        <BoundaryError error={error} />
      </AppBody>
      <AppFooter />
    </>
  )
}
