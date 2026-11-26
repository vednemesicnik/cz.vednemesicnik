import { describe, expect, test } from 'vitest'

import { buildNotHeldByOthersWhere } from './build-not-held-by-others-where'

const now = new Date('2026-10-15T14:00:00.000Z')

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
