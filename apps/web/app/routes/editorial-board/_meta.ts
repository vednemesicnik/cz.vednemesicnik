import type { MetaFunction } from 'react-router'
import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'

export const meta: MetaFunction = ({ location }) => {
  return createPageSEO({
    description: 'Seznam členů a kontakt na redakci Vedneměsíčníku.',
    ogImage: resolveOgImageUrl(null, ENV.BASE_URL),
    title: 'Redakce',
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })
}
