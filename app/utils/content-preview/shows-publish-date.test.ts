import { describe, expect, test } from 'vitest'

import { showsPublishDate } from './shows-publish-date'

describe('showsPublishDate', () => {
  test.each([
    [null, true],
    ['archived', true],
    ['draft', false],
    ['pending', false],
    ['approved', false],
  ] as const)('%s → %s', (previewState, expected) => {
    expect(showsPublishDate(previewState)).toBe(expected)
  })
})
