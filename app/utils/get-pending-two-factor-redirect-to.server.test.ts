import { describe, expect, test } from 'vitest'

import { getPendingTwoFactorRedirectTo } from '~/utils/get-pending-two-factor-redirect-to.server'
import {
  getPendingTwoFactorCookieSession,
  setPendingTwoFactorCookieSession,
} from '~/utils/pending-two-factor.server'

const readBack = async (redirectTo: string) => {
  const setCookie = await setPendingTwoFactorCookieSession(
    new Request('https://test.local/'),
    { redirectTo, userId: 'user-1' },
  )

  return getPendingTwoFactorRedirectTo(
    await getPendingTwoFactorCookieSession(
      new Request('https://test.local/', { headers: { Cookie: setCookie } }),
    ),
  )
}

describe('getPendingTwoFactorRedirectTo', () => {
  test('returns the stored same-origin target', async () => {
    expect(await readBack('/administration/settings?continue=x')).toBe(
      '/administration/settings?continue=x',
    )
  })

  test('falls back to /administration for an external target', async () => {
    expect(await readBack('//evil.com')).toBe('/administration')
  })

  test('falls back to /administration without a pending cookie', async () => {
    const cookieSession = await getPendingTwoFactorCookieSession(
      new Request('https://test.local/'),
    )

    expect(getPendingTwoFactorRedirectTo(cookieSession)).toBe('/administration')
  })
})
