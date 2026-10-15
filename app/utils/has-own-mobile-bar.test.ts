import { describe, expect, it } from 'vitest'

import { hasOwnMobileBar } from './has-own-mobile-bar'

describe('hasOwnMobileBar', () => {
  it('is set by a matched route’s handle', () => {
    expect(
      hasOwnMobileBar([{ handle: {} }, { handle: { hasOwnMobileBar: true } }]),
    ).toBe(true)
  })

  it('is off without the flag', () => {
    expect(hasOwnMobileBar([{ handle: undefined }, { handle: {} }])).toBe(false)
  })
})
