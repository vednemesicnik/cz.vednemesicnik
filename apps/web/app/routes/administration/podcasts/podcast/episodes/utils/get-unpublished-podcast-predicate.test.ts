import { describe, expect, test } from 'vitest'

import { getUnpublishedPodcastPredicate } from './get-unpublished-podcast-predicate'

describe('getUnpublishedPodcastPredicate', () => {
  test('a published podcast has nothing to say', () => {
    expect(getUnpublishedPodcastPredicate('published')).toBeNull()
  })

  test('a draft podcast is not published', () => {
    expect(getUnpublishedPodcastPredicate('draft')).toBe('není publikovaný.')
  })

  test('an archived podcast says so', () => {
    expect(getUnpublishedPodcastPredicate('archived')).toBe('je archivovaný.')
  })
})
