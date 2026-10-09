import type { MetaFunction } from 'react-router'
import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'

export const meta: MetaFunction = ({ location }) => {
  return createPageSEO({
    ogImage: resolveOgImageUrl(null, ENV.BASE_URL),
    title: 'Podpora',
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })
}
