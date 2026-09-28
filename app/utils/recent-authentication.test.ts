import { describe, expect, test } from 'vitest'

import {
  isRecentAuthentication,
  RECENT_AUTHENTICATION_MAX_AGE_MS,
} from './recent-authentication'

const now = new Date('2026-09-28T12:00:00Z')

describe('isRecentAuthentication', () => {
  test('accepts a sign-in inside the window', () => {
    expect(isRecentAuthentication(new Date(now.getTime() - 60_000), now)).toBe(
      true,
    )
  })

  test('accepts a sign-in exactly at the edge of the window', () => {
    const edge = new Date(now.getTime() - RECENT_AUTHENTICATION_MAX_AGE_MS)
    expect(isRecentAuthentication(edge, now)).toBe(true)
  })

  test('rejects a sign-in older than the window', () => {
    const stale = new Date(now.getTime() - RECENT_AUTHENTICATION_MAX_AGE_MS - 1)
    expect(isRecentAuthentication(stale, now)).toBe(false)
  })
})
