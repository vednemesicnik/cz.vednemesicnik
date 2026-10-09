import { href } from 'react-router'
import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const pageSeo = createPageSEO({
    description: 'Archiv čísel Vedneměsíčníku',
    ogImage: resolveOgImageUrl(loaderData.ogImageUrl, ENV.BASE_URL),
    title: 'Archiv',
    // A square thumbnail fits a portrait cover better than the 2:1 large card.
    twitterCard: 'summary',
    url: new URL(href('/archive'), ENV.BASE_URL).href,
  })

  return [...pageSeo]
}
