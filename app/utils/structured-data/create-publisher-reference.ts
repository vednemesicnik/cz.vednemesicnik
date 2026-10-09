import { SITE_LOGO_PATH, SITE_NAME } from '~/config/site-config'

/**
 * Generates the publisher Organization nested inside other JSON-LD objects
 * (Article, PodcastSeries, …), hence without `@context`.
 *
 * @param baseUrl - The site origin (`ENV.BASE_URL`)
 * @returns Schema.org Organization for a `publisher` property
 */
export const createPublisherReference = (baseUrl: string) => {
  return {
    '@type': 'Organization',
    logo: {
      '@type': 'ImageObject',
      url: new URL(SITE_LOGO_PATH, baseUrl).href,
    },
    name: SITE_NAME,
    url: new URL('/', baseUrl).href,
  }
}
