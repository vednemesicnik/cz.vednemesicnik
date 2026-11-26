import { describe, expect, it } from 'vitest'

import { getPasskeyKind } from './get-passkey-kind'

describe('getPasskeyKind', () => {
  it('reads a platform attachment as built-in, even with hybrid', () => {
    expect(
      getPasskeyKind({
        authenticatorAttachment: 'platform',
        transports: ['hybrid', 'internal'],
      }),
    ).toBe('built_in')
  })

  it('reads a cross-platform attachment with hybrid as a phone', () => {
    expect(
      getPasskeyKind({
        authenticatorAttachment: 'cross-platform',
        transports: ['hybrid', 'internal'],
      }),
    ).toBe('phone')
  })

  it.each([[['usb']], [['nfc', 'usb']], [['ble']], [undefined]])(
    'reads a cross-platform attachment with %j as a security key',
    (transports) => {
      expect(
        getPasskeyKind({
          authenticatorAttachment: 'cross-platform',
          transports,
        }),
      ).toBe('security_key')
    },
  )

  it.each([undefined, null, 'unknown'])(
    'returns null for the attachment %j',
    (authenticatorAttachment) => {
      expect(
        getPasskeyKind({ authenticatorAttachment, transports: ['internal'] }),
      ).toBeNull()
    },
  )
})
