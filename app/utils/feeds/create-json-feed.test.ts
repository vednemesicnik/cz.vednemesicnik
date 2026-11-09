import { describe, expect, test } from 'vitest'

import { createJsonFeed } from './create-json-feed'
import type { FeedChannel, FeedItem } from './feed-types'

const channel: FeedChannel = {
  description: 'Nová tištěná čísla časopisu.',
  feedUrl: 'https://vednemesicnik.cz/feeds/archive.json',
  link: 'https://vednemesicnik.cz/archive',
  title: 'Vedneměsíčník: Archiv čísel',
}

const item: FeedItem = {
  link: 'https://vednemesicnik.cz/archive/2026-3.pdf',
  publishedAt: new Date('2026-11-02T08:30:00Z'),
  title: 'podzim 2026',
}

describe('createJsonFeed', () => {
  test('should write a JSON Feed 1.1 document with the channel', () => {
    const feed = JSON.parse(createJsonFeed({ channel, items: [] }))

    expect(feed).toEqual({
      description: 'Nová tištěná čísla časopisu.',
      feed_url: 'https://vednemesicnik.cz/feeds/archive.json',
      home_page_url: 'https://vednemesicnik.cz/archive',
      items: [],
      language: 'cs',
      title: 'Vedneměsíčník: Archiv čísel',
      version: 'https://jsonfeed.org/version/1.1',
    })
  })

  test('should use the link as id and url and the date in ISO 8601', () => {
    const [entry] = JSON.parse(createJsonFeed({ channel, items: [item] })).items

    expect(entry.id).toBe('https://vednemesicnik.cz/archive/2026-3.pdf')
    expect(entry.url).toBe('https://vednemesicnik.cz/archive/2026-3.pdf')
    expect(entry.date_published).toBe('2026-11-02T08:30:00.000Z')
  })

  test('should fall back to the title for the text and leave out no author', () => {
    const [entry] = JSON.parse(createJsonFeed({ channel, items: [item] })).items

    expect(entry.content_text).toBe('podzim 2026')
    expect(entry).not.toHaveProperty('authors')
  })

  test('should carry the description and the author', () => {
    const [entry] = JSON.parse(
      createJsonFeed({
        channel,
        items: [{ ...item, author: 'Jana Nováková', description: 'Úvod.' }],
      }),
    ).items

    expect(entry.content_text).toBe('Úvod.')
    expect(entry.authors).toEqual([{ name: 'Jana Nováková' }])
  })
})
