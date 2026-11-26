import { describe, expect, it } from 'vitest'

import { skipsOwnAccountReload } from './skips-own-account-reload'

describe('skipsOwnAccountReload', () => {
  it('is set by a matched route’s handle', () => {
    expect(
      skipsOwnAccountReload([
        { handle: {} },
        { handle: { skipsOwnAccountReload: true } },
      ]),
    ).toBe(true)
  })

  it('is off without the flag', () => {
    expect(skipsOwnAccountReload([{ handle: undefined }, { handle: {} }])).toBe(
      false,
    )
  })
})
