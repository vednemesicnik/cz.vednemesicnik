import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'

import type { Route } from './+types/route'

const TITLES = {
  confirmActive: 'Jste pořád v redakci?',
  leave: 'Potvrďte odchod',
  reactivate: 'Jste pořád v redakci?',
} as const

const titleOf = (loaderData: Route.MetaArgs['loaderData']) => {
  if (loaderData?.status === 'valid') return TITLES[loaderData.action]
  if (loaderData?.status === 'expired') return 'Odkaz už neplatí'
  return 'Tento odkaz nelze použít'
}

// `pathname` alone: the token stays out of the canonical address.
export const meta: Route.MetaFunction = ({ loaderData, location }) =>
  createPageSEO({
    ogImage: resolveOgImageUrl(null, ENV.BASE_URL),
    robots: 'noindex, nofollow',
    title: titleOf(loaderData),
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })
