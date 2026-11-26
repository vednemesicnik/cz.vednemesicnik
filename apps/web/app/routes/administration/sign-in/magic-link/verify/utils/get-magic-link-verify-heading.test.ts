import { describe, expect, it } from 'vitest'
import { getMagicLinkVerifyHeading } from './get-magic-link-verify-heading'

describe('getMagicLinkVerifyHeading', () => {
  it.each([
    ['valid', 'Potvrďte přihlášení'],
    ['verify-identity', 'Ověřte, že jste to vy'],
    ['invalid', 'Odkaz už neplatí'],
    ['invalid-signed-in', 'Odkaz už neplatí'],
    ['other-account', 'Odkaz je pro jiný účet'],
  ] as const)('should head the %s state %s', (status, heading) => {
    expect(getMagicLinkVerifyHeading(status)).toBe(heading)
  })
})
