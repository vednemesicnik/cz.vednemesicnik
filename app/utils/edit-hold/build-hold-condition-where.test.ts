import { describe, expect, test } from 'vitest'

import { buildHoldConditionWhere } from './build-hold-condition-where'
import { buildNotHeldByOthersWhere } from './build-not-held-by-others-where'

const now = new Date('2026-10-15T14:00:00.000Z')
const updatedAt = new Date('2026-10-15T13:00:00.000Z')

describe('buildHoldConditionWhere', () => {
  test('takes only a free hold on an unchanged draft', () => {
    expect(buildHoldConditionWhere({ holder: 'free', now, updatedAt })).toEqual(
      {
        AND: [
          { state: 'draft', updatedAt },
          {
            OR: [
              { heldByAuthorId: null },
              { heldUntil: null },
              { heldUntil: { lte: now } },
            ],
          },
        ],
      },
    )
  })

  test('renews or releases only the holding tab', () => {
    expect(
      buildHoldConditionWhere({
        holder: { authorId: 'anna', tabId: 'tab-1' },
        now,
        updatedAt,
      }).AND[1],
    ).toEqual({ heldByAuthorId: 'anna', heldByTabId: 'tab-1' })
  })

  test('takes over whoever holds it', () => {
    expect(
      buildHoldConditionWhere({ holder: 'any', now, updatedAt }).AND[1],
    ).toEqual({})
  })
})

describe('buildNotHeldByOthersWhere', () => {
  test('free, expired, or one’s own', () => {
    expect(buildNotHeldByOthersWhere('anna', now)).toEqual({
      OR: [
        { heldByAuthorId: null },
        { heldUntil: null },
        { heldUntil: { lte: now } },
        { heldByAuthorId: 'anna' },
      ],
    })
  })
})
