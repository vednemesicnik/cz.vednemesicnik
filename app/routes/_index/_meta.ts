import type { MetaFunction } from 'react-router'
import { createPageSEO } from '~/utils/create-page-seo'
import { resolveOgImageUrl } from '~/utils/resolve-og-image-url'
import { createOrganizationStructuredData } from '~/utils/structured-data/create-organization-structured-data'
import { createWebSiteStructuredData } from '~/utils/structured-data/create-web-site-structured-data'

export const meta: MetaFunction = ({ location }) => {
  const pageSEO = createPageSEO({
    description: 'Studentské nekritické noviny',
    ogImage: resolveOgImageUrl(null, ENV.BASE_URL),
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })

  // Site-wide entities live on the homepage only, never in the layout.
  return [
    ...pageSEO,
    { 'script:ld+json': createOrganizationStructuredData(ENV.BASE_URL) },
    { 'script:ld+json': createWebSiteStructuredData(ENV.BASE_URL) },
  ]
}
