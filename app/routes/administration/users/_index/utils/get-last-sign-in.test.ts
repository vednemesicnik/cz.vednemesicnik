import { describe, expect, test } from 'vitest'

import { AUTH_LOG_CONFIG } from '~/config/auth-log-config'

import { getLastSignIn } from './get-last-sign-in'

const now = new Date('2026-10-23T12:00:00.000Z')
const daysBefore = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

describe('getLastSignIn', () => {
  test('a record gives its date, whatever the account age', () => {
    const at = daysBefore(3)

    expect(
      getLastSignIn({
        accountCreatedAt: daysBefore(400),
        lastSignInAt: at,
        now,
      }),
    ).toEqual({ at, kind: 'date' })
  })

  test('a young account without a record has never signed in', () => {
    expect(
      getLastSignIn({
        accountCreatedAt: daysBefore(10),
        lastSignInAt: null,
        now,
      }),
    ).toEqual({ kind: 'never' })
  })

  test('an old account without a record only has no sign-in within retention', () => {
    expect(
      getLastSignIn({
        accountCreatedAt: daysBefore(200),
        lastSignInAt: null,
        now,
      }),
    ).toEqual({ kind: 'not-within-retention' })
  })

  test('an account exactly as old as the retention window is old', () => {
    expect(
      getLastSignIn({
        accountCreatedAt: daysBefore(AUTH_LOG_CONFIG.retentionDays),
        lastSignInAt: null,
        now,
      }),
    ).toEqual({ kind: 'not-within-retention' })
  })
})
