import { describe, expect, it } from 'vitest'
import { getEmergencyLinkVerifyHeading } from './get-emergency-link-verify-heading'

describe('getEmergencyLinkVerifyHeading', () => {
  it.each([
    ['valid', 'Potvrďte přihlášení'],
    ['same-account', 'Už jste přihlášení'],
    ['other-account', 'Odkaz je pro jiný účet'],
    ['invalid', 'Odkaz už neplatí'],
    ['invalid-signed-in', 'Odkaz už neplatí'],
  ] as const)('should head the %s state %s', (status, heading) => {
    expect(getEmergencyLinkVerifyHeading(status)).toBe(heading)
  })
})
