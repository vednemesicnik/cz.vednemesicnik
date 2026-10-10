import { describe, expect, it } from 'vitest'

import { canUseEmergencyPassword } from './can-use-emergency-password'

describe('canUseEmergencyPassword', () => {
  it('allows the Owner (level 1)', () => {
    expect(canUseEmergencyPassword(1)).toBe(true)
  })

  it('allows an Administrator (level 2)', () => {
    expect(canUseEmergencyPassword(2)).toBe(true)
  })

  it('refuses a Member (level 3)', () => {
    expect(canUseEmergencyPassword(3)).toBe(false)
  })
})
