import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'

import type { Route } from './+types/route'

// Hidden: only the leaflet's QR code leads here (design 15e).
export const meta: Route.MetaFunction = ({ location }) =>
  createPageSEO({
    ogImage: resolveOgImageUrl(null, ENV.BASE_URL),
    robots: 'noindex, nofollow',
    title: 'Přidejte se k redakci',
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })
