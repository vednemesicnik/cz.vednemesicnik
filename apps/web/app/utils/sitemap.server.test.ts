import { describe, expect, test } from 'vitest'

import { createSitemapResponse, createSitemapXml } from '~/utils/sitemap.server'

describe('createSitemapXml', () => {
  test('should start with the XML declaration and the sitemap namespace', () => {
    const xml = createSitemapXml([])

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(
      true,
    )
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    )
  })

  test('should produce an empty urlset for no entries', () => {
    const xml = createSitemapXml([])

    expect(xml).not.toContain('<url>')
    expect(xml).toContain('</urlset>')
  })

  test('should write one url element per entry', () => {
    const xml = createSitemapXml([
      { loc: 'https://vednemesicnik.cz/' },
      { loc: 'https://vednemesicnik.cz/articles' },
      { loc: 'https://vednemesicnik.cz/podcasts' },
    ])

    expect(xml.match(/<url>/g)).toHaveLength(3)
    expect(xml).toContain(
      '<url><loc>https://vednemesicnik.cz/articles</loc></url>',
    )
  })

  test('should leave out lastmod when the entry has none', () => {
    const xml = createSitemapXml([{ loc: 'https://vednemesicnik.cz/' }])

    expect(xml).not.toContain('<lastmod>')
  })

  test('should write lastmod in ISO 8601', () => {
    const xml = createSitemapXml([
      {
        lastmod: new Date(Date.UTC(2026, 9, 4, 12, 30)),
        loc: 'https://vednemesicnik.cz/articles/clanek',
      },
    ])

    expect(xml).toContain(
      '<url><loc>https://vednemesicnik.cz/articles/clanek</loc><lastmod>2026-10-04T12:30:00.000Z</lastmod></url>',
    )
  })

  test('should escape reserved characters in the location', () => {
    const xml = createSitemapXml([
      { loc: 'https://vednemesicnik.cz/articles?page=2&sort=new' },
    ])

    expect(xml).toContain(
      '<loc>https://vednemesicnik.cz/articles?page=2&amp;sort=new</loc>',
    )
  })
})

describe('createSitemapResponse', () => {
  test('should serve the document as cacheable UTF-8 XML', async () => {
    const response = createSitemapResponse('<urlset/>')

    expect(response.headers.get('Content-Type')).toBe(
      'application/xml; charset=utf-8',
    )
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
    expect(await response.text()).toBe('<urlset/>')
  })
})
