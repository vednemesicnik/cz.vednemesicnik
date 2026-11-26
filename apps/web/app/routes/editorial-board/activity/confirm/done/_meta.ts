import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData, location }) =>
  createPageSEO({
    ogImage: resolveOgImageUrl(null, ENV.BASE_URL),
    robots: 'noindex, nofollow',
    title:
      loaderData?.action === 'leave'
        ? 'Děkujeme za spolupráci'
        : 'Díky, že jste s námi',
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })
