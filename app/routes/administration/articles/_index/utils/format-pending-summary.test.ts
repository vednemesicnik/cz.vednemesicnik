import { describe, expect, test } from 'vitest'

import { formatWaitingWork } from './format-waiting-work'

describe('formatWaitingWork', () => {
  test('agrees with the count', () => {
    expect(formatWaitingWork(1)).toBe('Na schválení čeká 1 článek')
    expect(formatWaitingWork(2)).toBe('Na schválení čekají 2 články')
    expect(formatWaitingWork(4)).toBe('Na schválení čekají 4 články')
    expect(formatWaitingWork(5)).toBe('Na schválení čeká 5 článků')
  })
})
