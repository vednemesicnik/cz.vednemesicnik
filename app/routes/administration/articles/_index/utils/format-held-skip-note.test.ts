import { describe, expect, test } from 'vitest'

import { formatHeldSkipNote } from './format-held-skip-note'

describe('formatHeldSkipNote', () => {
  test.each([
    [0, null],
    [1, '1 článek právě někdo upravuje. Přeskočí se.'],
    [2, '2 články právě někdo upravuje. Přeskočí se.'],
    [5, '5 článků právě někdo upravuje. Přeskočí se.'],
  ])('%i held (22f)', (count, note) => {
    expect(formatHeldSkipNote(count)).toBe(note)
  })
})
