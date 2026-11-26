import { SITE_NAME } from '~/config/site-config'

/**
 * Generates the site-wide Schema.org WebSite structured data.
 *
 * Belongs on the homepage only. No `potentialAction: SearchAction` — the site
 * has no search.
 *
 * @param baseUrl - The site origin (`ENV.BASE_URL`)
 * @returns JSON-LD object conforming to Schema.org WebSite
 *
 * @see https://schema.org/WebSite
 */
export const createWebSiteStructuredData = (baseUrl: string) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    inLanguage: 'cs',
    name: SITE_NAME,
    url: new URL('/', baseUrl).href,
  }
}
