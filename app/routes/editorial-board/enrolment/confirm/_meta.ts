import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'

import type { Route } from './+types/route'

// `pathname` alone: the token stays out of the canonical address.
export const meta: Route.MetaFunction = ({ loaderData, location }) =>
  createPageSEO({
    ogImage: resolveOgImageUrl(null, ENV.BASE_URL),
    robots: 'noindex, nofollow',
    title:
      loaderData?.status === 'valid'
        ? 'Potvrďte přihlášku'
        : 'Tento odkaz nelze použít',
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })
