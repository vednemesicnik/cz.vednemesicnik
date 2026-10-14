import { describe, expect, test } from 'vitest'

import { formatPendingSummary } from './format-pending-summary'

describe('formatPendingSummary', () => {
  test('agrees with the count', () => {
    expect(formatPendingSummary(1)).toBe('na schválení čeká celkem 1 článek')
    expect(formatPendingSummary(2)).toBe('na schválení čekají celkem 2 články')
    expect(formatPendingSummary(4)).toBe('na schválení čekají celkem 4 články')
    expect(formatPendingSummary(5)).toBe('na schválení čeká celkem 5 článků')
  })
})
