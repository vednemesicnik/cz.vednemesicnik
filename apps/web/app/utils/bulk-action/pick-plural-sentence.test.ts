import { describe, expect, test } from 'vitest'

import { pickPluralSentence } from './pick-plural-sentence'

const SENTENCES = {
  few: 'jsou neúplné.',
  one: 'je neúplný.',
  other: 'je neúplných.',
}

describe('pickPluralSentence', () => {
  test.each([
    [1, 'je neúplný.'],
    [2, 'jsou neúplné.'],
    [4, 'jsou neúplné.'],
    [5, 'je neúplných.'],
    [0, 'je neúplných.'],
  ])('%i', (count, expected) => {
    expect(pickPluralSentence(count, SENTENCES)).toBe(expected)
  })
})
