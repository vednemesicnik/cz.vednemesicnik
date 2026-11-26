import { SITE_LOGO_PATH, SITE_NAME } from '~/config/site-config'
import { socialSitesConfig } from '~/config/social-sites-config'

/**
 * Generates the site-wide Schema.org Organization structured data.
 *
 * Belongs on the homepage only — Google reads site-wide entities from one
 * representative page.
 *
 * @param baseUrl - The site origin (`ENV.BASE_URL`)
 * @returns JSON-LD object conforming to Schema.org Organization
 *
 * @see https://schema.org/Organization
 */
export const createOrganizationStructuredData = (baseUrl: string) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    logo: new URL(SITE_LOGO_PATH, baseUrl).href,
    name: SITE_NAME,
    sameAs: [socialSitesConfig.instagram.href, socialSitesConfig.facebook.href],
    url: new URL('/', baseUrl).href,
  }
}
