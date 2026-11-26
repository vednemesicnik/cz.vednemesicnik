import { describe, expect, test } from 'vitest'

import {
  ARTICLE_NOUN,
  EPISODE_NOUN,
  ISSUE_NOUN,
} from '~/config/list-noun-config'

import { formatPendingSummary } from './format-pending-summary'

describe('formatPendingSummary', () => {
  test('agrees with the count', () => {
    expect(formatPendingSummary(1, ARTICLE_NOUN)).toBe(
      'na schválení čeká celkem 1 článek',
    )
    expect(formatPendingSummary(2, ARTICLE_NOUN)).toBe(
      'na schválení čekají celkem 2 články',
    )
    expect(formatPendingSummary(4, ARTICLE_NOUN)).toBe(
      'na schválení čekají celkem 4 články',
    )
    expect(formatPendingSummary(5, ARTICLE_NOUN)).toBe(
      'na schválení čeká celkem 5 článků',
    )
  })

  test('speaks in the noun of the list', () => {
    expect(formatPendingSummary(1, EPISODE_NOUN)).toBe(
      'na schválení čeká celkem 1 epizoda',
    )
    expect(formatPendingSummary(3, ISSUE_NOUN)).toBe(
      'na schválení čekají celkem 3 čísla',
    )
    expect(formatPendingSummary(22, ISSUE_NOUN)).toBe(
      'na schválení čeká celkem 22 čísel',
    )
    expect(formatPendingSummary(5, ISSUE_NOUN)).toBe(
      'na schválení čeká celkem 5 čísel',
    )
  })
})
