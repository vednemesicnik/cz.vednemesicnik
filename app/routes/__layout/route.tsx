// noinspection JSUnusedGlobalSymbols

import { Outlet, useLocation, useRouteLoaderData } from 'react-router'
import { AppBody } from '~/components/app-body'
import { AppFooter } from '~/components/app-footer'
import { AppHeader } from '~/components/app-header'
import { BoundaryError } from '~/components/boundary-error'
import { PageTransition } from '~/components/page-transition'
import { usePageFlightClicks } from '~/hooks/use-page-flight-clicks'
import { getSiteFeedLinks } from '~/utils/feeds/get-site-feed-links'
import type { loader } from './_loader'
import type { Route } from './+types/route'
import { SitePreviewBar } from './components/site-preview-bar'
import './_styles.css'

export { loader } from './_loader'
export { meta } from './_meta'

// Browsers and feed readers find the site's feeds from any website page; the
// administration offers none.
export const links: Route.LinksFunction = () => getSiteFeedLinks()

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { pathname, search } = useLocation()

  usePageFlightClicks()

  // A new page for every address, the next page of a list included (18d).
  return (
    <>
      <AppHeader>
        <SitePreviewBar previewMode={loaderData.previewMode} />
      </AppHeader>
      <AppBody>
        <PageTransition transitionKey={pathname + search}>
          <Outlet />
        </PageTransition>
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
