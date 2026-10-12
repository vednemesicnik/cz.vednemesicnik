import { describe, expect, test } from 'vitest'

import { createEmergencySignInLinkUrl } from './create-emergency-sign-in-link-url'

describe('createEmergencySignInLinkUrl', () => {
  test('carries only the token, on the deployment origin', () => {
    expect(
      createEmergencySignInLinkUrl({
        baseUrl: 'https://vednemesicnik.cz',
        token: 'q8Zt-_x',
      }),
    ).toBe(
      'https://vednemesicnik.cz/administration/sign-in/emergency-link/verify?token=q8Zt-_x',
    )
  })
})
