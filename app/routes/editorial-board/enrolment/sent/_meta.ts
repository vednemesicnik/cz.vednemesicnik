import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ location }) =>
  createPageSEO({
    ogImage: resolveOgImageUrl(null, ENV.BASE_URL),
    robots: 'noindex, nofollow',
    title: 'Zkontrolujte e-mail',
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })
