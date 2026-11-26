import { describe, expect, test } from 'vitest'

import { truncateAtWordBoundary } from './truncate-at-word-boundary'

describe('truncateAtWordBoundary', () => {
  test('keeps a text that fits', () => {
    expect(truncateAtWordBoundary('Krátký popis epizody.', 160)).toBe(
      'Krátký popis epizody.',
    )
  })

  test('cuts after the last whole word and adds an ellipsis', () => {
    expect(
      truncateAtWordBoundary('Laboratoř je od jara v rekonstrukci', 20),
    ).toBe('Laboratoř je od…')
  })

  test('stays within the length, the ellipsis included', () => {
    const text = 'slovo '.repeat(60)

    expect(truncateAtWordBoundary(text, 160).length).toBeLessThanOrEqual(160)
  })

  test('drops punctuation left before the ellipsis', () => {
    expect(truncateAtWordBoundary('Dánsko, Malta, Švýcarsko a další', 16)).toBe(
      'Dánsko, Malta…',
    )
  })

  test('cuts inside a first word longer than the length', () => {
    expect(truncateAtWordBoundary('Nejneobhospodařovávatelnější', 10)).toBe(
      'Nejneobho…',
    )
  })

  test('collapses whitespace and line breaks', () => {
    expect(truncateAtWordBoundary('  Dva\n\nodstavce  ', 160)).toBe(
      'Dva odstavce',
    )
  })
})
