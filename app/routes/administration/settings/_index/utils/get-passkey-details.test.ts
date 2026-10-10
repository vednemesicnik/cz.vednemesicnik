import { describe, expect, it } from 'vitest'

import { getPasskeyDetails } from './get-passkey-details'

describe('getPasskeyDetails', () => {
  it('lists the type, the date added and the last use', () => {
    expect(
      getPasskeyDetails({
        createdAt: '3. 9. 2026',
        lastUsedAt: '25. 9. 2026',
        type: 'synchronizovaný',
      }),
    ).toEqual(['synchronizovaný', 'přidán 3. 9. 2026', 'naposledy 25. 9. 2026'])
  })

  it('leaves out the last use of a passkey never used', () => {
    expect(
      getPasskeyDetails({
        createdAt: '3. 9. 2026',
        lastUsedAt: null,
        type: 'vázaný na zařízení',
      }),
    ).toEqual(['vázaný na zařízení', 'přidán 3. 9. 2026'])
  })

  it('leaves out the type when it is the title', () => {
    expect(
      getPasskeyDetails({
        createdAt: '3. 9. 2026',
        lastUsedAt: '25. 9. 2026',
        type: null,
      }),
    ).toEqual(['přidán 3. 9. 2026', 'naposledy 25. 9. 2026'])
  })
})
