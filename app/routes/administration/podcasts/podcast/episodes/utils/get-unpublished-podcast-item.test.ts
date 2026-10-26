import { describe, expect, test } from 'vitest'

import { getUnpublishedPodcastItem } from './get-unpublished-podcast-item'

describe('getUnpublishedPodcastItem', () => {
  test('a published podcast blocks nothing', () => {
    expect(
      getUnpublishedPodcastItem({ state: 'published', title: 'Kabinet' }),
    ).toBeNull()
  })

  test('a draft podcast is not published', () => {
    expect(
      getUnpublishedPodcastItem({ state: 'draft', title: 'Přestávka' }),
    ).toBe('Podcast Přestávka není publikovaný.')
  })

  test('an archived podcast says so', () => {
    expect(
      getUnpublishedPodcastItem({ state: 'archived', title: 'Přestávka' }),
    ).toBe('Podcast Přestávka je archivovaný.')
  })
})
