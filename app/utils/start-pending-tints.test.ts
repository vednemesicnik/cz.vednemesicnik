import { describe, expect, test } from 'vitest'
import type { LiveChange } from '~/hooks/use-live-changes'
import { startPendingTints } from './start-pending-tints'

const createChange = (tintStartedAt: number | null): LiveChange => ({
  name: 'Marie Horáková',
  occurredAt: new Date('2026-10-13T10:00:00.000Z'),
  sequence: 1,
  tintStartedAt,
})

describe('startPendingTints', () => {
  test('starts a pending tint at the given time and keeps started ones', () => {
    const started = createChange(1_000)
    const changes = new Map([
      ['pending', createChange(null)],
      ['started', started],
    ])

    const next = startPendingTints(changes, 5_000)

    expect(next.get('pending')?.tintStartedAt).toBe(5_000)
    expect(next.get('started')).toBe(started)
  })

  test('returns the same map when no tint waits', () => {
    const changes = new Map([['started', createChange(1_000)]])

    expect(startPendingTints(changes, 5_000)).toBe(changes)
  })
})
