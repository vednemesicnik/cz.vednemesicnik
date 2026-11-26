import { describe, expect, test } from 'vitest'

import { getFreeSlugSuggestion } from './get-free-slug-suggestion'

describe('getFreeSlugSuggestion', () => {
  test('suggests the address with -2', () => {
    expect(getFreeSlugSuggestion('skola', ['skola'])).toBe('skola-2')
  })

  test('skips the numbered addresses already taken', () => {
    expect(
      getFreeSlugSuggestion('skola', ['skola', 'skola-2', 'skola-3']),
    ).toBe('skola-4')
  })

  test('ignores addresses that only start the same way', () => {
    expect(getFreeSlugSuggestion('skola', ['skola', 'skolak-2'])).toBe(
      'skola-2',
    )
  })
})
