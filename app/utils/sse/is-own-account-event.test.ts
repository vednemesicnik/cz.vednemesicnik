import { describe, expect, test } from 'vitest'

import type { AccountEvent } from './account-event'
import { isOwnAccountEvent } from './is-own-account-event'

const account = { authorId: 'a1', userId: 'u1' }

const event = (entity: AccountEvent['entity'], entityId: string) => ({
  change: 'update' as const,
  entity,
  entityId,
  occurredAt: '2026-10-24T12:00:00.000Z',
})

describe('isOwnAccountEvent', () => {
  test.each([
    ['own user', event('user', 'u1'), true],
    ['own author', event('author', 'a1'), true],
    ['another user', event('user', 'u2'), false],
    ['another author', event('author', 'a2'), false],
    // Ids of different tables may coincide; the entity decides.
    ['an author id given as a user', event('user', 'a1'), false],
  ])('%s', (_case, accountEvent, expected) => {
    expect(isOwnAccountEvent(accountEvent, account)).toBe(expected)
  })
})
