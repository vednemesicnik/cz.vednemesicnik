import { href } from 'react-router'
import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = () => {
  const pageSeo = createPageSEO({
    description: 'Archiv čísel Vedneměsíčníku',
    // The default image until covers get a share crop.
    ogImage: resolveOgImageUrl(null, ENV.BASE_URL),
    title: 'Archiv',
    url: new URL(href('/archive'), ENV.BASE_URL).href,
  })

  return [...pageSeo]
}
