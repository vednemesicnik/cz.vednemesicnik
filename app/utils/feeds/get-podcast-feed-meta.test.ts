import { describe, expect, test } from 'vitest'

import { getPodcastFeedMeta } from './get-podcast-feed-meta'

describe('getPodcastFeedMeta', () => {
  test('links the podcast feed by its id, in RSS and JSON Feed', () => {
    expect(getPodcastFeedMeta({ id: 'podcast-1', title: 'Kabinet' })).toEqual([
      {
        href: '/feeds/podcasts/podcast-1.xml',
        rel: 'alternate',
        tagName: 'link',
        title: 'Vedneměsíčník: Podcast Kabinet (RSS)',
        type: 'application/rss+xml',
      },
      {
        href: '/feeds/podcasts/podcast-1.json',
        rel: 'alternate',
        tagName: 'link',
        title: 'Vedneměsíčník: Podcast Kabinet (JSON Feed)',
        type: 'application/feed+json',
      },
    ])
  })
})
