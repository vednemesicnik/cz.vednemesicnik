import { describe, expect, test } from 'vitest'

import { createRssFeed } from './create-rss-feed'
import type { FeedChannel, FeedItem } from './feed-types'

const channel: FeedChannel = {
  description: 'Nové články z našeho webu.',
  feedUrl: 'https://vednemesicnik.cz/feeds/articles.xml',
  link: 'https://vednemesicnik.cz/articles',
  title: 'Vedneměsíčník: Články',
}

const item: FeedItem = {
  author: 'Jana Nováková',
  description: 'Krátký úvod.',
  link: 'https://vednemesicnik.cz/articles/prvni-clanek',
  publishedAt: new Date('2026-11-02T08:30:00Z'),
  title: 'První článek',
}

describe('createRssFeed', () => {
  test('should write an RSS 2.0 document with the channel in Czech', () => {
    const xml = createRssFeed({ channel, items: [] })

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(
      true,
    )
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<title>Vedneměsíčník: Články</title>')
    expect(xml).toContain('<link>https://vednemesicnik.cz/articles</link>')
    expect(xml).toContain('<language>cs</language>')
    expect(xml).toContain(
      '<atom:link href="https://vednemesicnik.cz/feeds/articles.xml" rel="self" type="application/rss+xml"/>',
    )
  })

  test('should leave out lastBuildDate and items without items', () => {
    const xml = createRssFeed({ channel, items: [] })

    expect(xml).not.toContain('<lastBuildDate>')
    expect(xml).not.toContain('<item>')
  })

  test('should write one item with its guid, creator and RFC 822 date', () => {
    const xml = createRssFeed({ channel, items: [item] })

    expect(xml.match(/<item>/g)).toHaveLength(1)
    expect(xml).toContain(
      '<guid isPermaLink="true">https://vednemesicnik.cz/articles/prvni-clanek</guid>',
    )
    expect(xml).toContain('<dc:creator>Jana Nováková</dc:creator>')
    expect(xml).toContain('<pubDate>Mon, 02 Nov 2026 08:30:00 GMT</pubDate>')
  })

  test('should take lastBuildDate from the newest item', () => {
    const older = { ...item, publishedAt: new Date('2026-10-01T10:00:00Z') }
    const xml = createRssFeed({ channel, items: [older, item] })

    expect(xml).toContain(
      '<lastBuildDate>Mon, 02 Nov 2026 08:30:00 GMT</lastBuildDate>',
    )
  })

  test('should leave out a missing description and author', () => {
    const xml = createRssFeed({
      channel,
      items: [{ ...item, author: undefined, description: undefined }],
    })

    expect(xml).not.toContain('<description>Krátký')
    expect(xml).not.toContain('<dc:creator>')
  })

  test('should escape reserved characters in texts', () => {
    const xml = createRssFeed({
      channel,
      items: [{ ...item, description: 'A < B', title: 'Tom & Jerry' }],
    })

    expect(xml).toContain('<title>Tom &amp; Jerry</title>')
    expect(xml).toContain('<description>A &lt; B</description>')
  })
})
