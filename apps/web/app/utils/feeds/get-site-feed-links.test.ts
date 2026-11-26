import { describe, expect, test } from 'vitest'

import { getSiteFeedLinks } from './get-site-feed-links'

describe('getSiteFeedLinks', () => {
  test('offers articles and the archive, each in RSS and JSON Feed', () => {
    expect(getSiteFeedLinks()).toEqual([
      {
        href: '/feeds/articles.xml',
        rel: 'alternate',
        title: 'Vedneměsíčník: Články (RSS)',
        type: 'application/rss+xml',
      },
      {
        href: '/feeds/articles.json',
        rel: 'alternate',
        title: 'Vedneměsíčník: Články (JSON Feed)',
        type: 'application/feed+json',
      },
      {
        href: '/feeds/archive.xml',
        rel: 'alternate',
        title: 'Vedneměsíčník: Archiv čísel (RSS)',
        type: 'application/rss+xml',
      },
      {
        href: '/feeds/archive.json',
        rel: 'alternate',
        title: 'Vedneměsíčník: Archiv čísel (JSON Feed)',
        type: 'application/feed+json',
      },
    ])
  })
})
