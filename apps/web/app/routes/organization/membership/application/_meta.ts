import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'

import type { Route } from './+types/route'

// Hidden: nothing on the site links to it and no step is indexed (1rs08xnl).
export const meta: Route.MetaFunction = ({ location, params }) =>
  createPageSEO({
    ogImage: resolveOgImageUrl(null, ENV.BASE_URL),
    robots: 'noindex, nofollow',
    title:
      params.stepName === 'sent' ? 'Přihlášku máme' : 'Přihláška do spolku',
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })
