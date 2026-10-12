import { describe, expect, test } from 'vitest'

import { getPendingTwoFactorEmail } from '~/utils/get-pending-two-factor-email.server'
import {
  getPendingTwoFactorCookieSession,
  setPendingTwoFactorCookieSession,
} from '~/utils/pending-two-factor.server'

describe('getPendingTwoFactorEmail', () => {
  test('returns the stored e-mail', async () => {
    const setCookie = await setPendingTwoFactorCookieSession(
      new Request('https://test.local/'),
      {
        email: 'jakub.novak@vednemesicnik.cz',
        redirectTo: '/administration',
        userId: 'user-1',
      },
    )

    const cookieSession = await getPendingTwoFactorCookieSession(
      new Request('https://test.local/', { headers: { Cookie: setCookie } }),
    )

    expect(getPendingTwoFactorEmail(cookieSession)).toBe(
      'jakub.novak@vednemesicnik.cz',
    )
  })

  test('returns null without a pending cookie', async () => {
    const cookieSession = await getPendingTwoFactorCookieSession(
      new Request('https://test.local/'),
    )

    expect(getPendingTwoFactorEmail(cookieSession)).toBeNull()
  })
})
