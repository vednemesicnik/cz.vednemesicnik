import { describe, expect, it } from 'vitest'

import { getPasskeyLabel } from './get-passkey-label'

describe('getPasskeyLabel', () => {
  it('titles a built-in passkey by its name', () => {
    expect(
      getPasskeyLabel({
        deviceType: 'multiDevice',
        kind: 'built_in',
        name: 'iPhone, Safari',
      }),
    ).toEqual({ title: 'iPhone, Safari', type: 'synchronizovaný' })
  })

  it('titles a security key by its kind', () => {
    expect(
      getPasskeyLabel({
        deviceType: 'singleDevice',
        kind: 'security_key',
        name: null,
      }),
    ).toEqual({ title: 'Bezpečnostní klíč', type: 'vázaný na zařízení' })
  })

  it('titles a phone by its kind', () => {
    expect(
      getPasskeyLabel({ deviceType: 'multiDevice', kind: 'phone', name: null }),
    ).toEqual({ title: 'Telefon nebo tablet', type: 'synchronizovaný' })
  })

  it('titles a passkey without a name by its type, once', () => {
    expect(
      getPasskeyLabel({ deviceType: 'multiDevice', kind: null, name: null }),
    ).toEqual({ title: 'Synchronizovaný', type: null })
  })

  it('titles a passkey named before #571 by its name', () => {
    expect(
      getPasskeyLabel({
        deviceType: 'singleDevice',
        kind: null,
        name: 'Mac, Chrome',
      }),
    ).toEqual({ title: 'Mac, Chrome', type: 'vázaný na zařízení' })
  })
})
