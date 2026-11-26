import { escapeXml } from '~/utils/escape-xml'

export type SitemapEntry = {
  loc: string
  lastmod?: Date
}

/**
 * Builds a sitemap document (sitemaps.org protocol 0.9) from a list of URLs.
 *
 * @param entries - Absolute page URLs, each with an optional last-modified date.
 * @returns The `<urlset>` XML document; `lastmod` is written in ISO 8601 (W3C
 * Datetime) and left out for entries without one.
 *
 * @example
 * createSitemapXml([{ loc: 'https://vednemesicnik.cz/articles' }])
 */
export const createSitemapXml = (entries: SitemapEntry[]) => {
  const urls = entries.map(({ loc, lastmod }) => {
    const lastmodElement = lastmod
      ? `<lastmod>${lastmod.toISOString()}</lastmod>`
      : ''

    return `  <url><loc>${escapeXml(loc)}</loc>${lastmodElement}</url>`
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

/**
 * Wraps a sitemap document in an HTTP response for a resource route.
 *
 * @param xml - The document from {@link createSitemapXml}.
 * @returns A response served as UTF-8 XML and cacheable publicly for an hour.
 */
export const createSitemapResponse = (xml: string) => {
  return new Response(xml, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
