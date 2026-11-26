import { describe, expect, it } from 'vitest'

import { detectDeclarationType } from './detect-declaration-type'

describe('detectDeclarationType', () => {
  it.each([
    ['application/pdf', [0x25, 0x50, 0x44, 0x46, 0x2d]],
    ['image/jpeg', [0xff, 0xd8, 0xff, 0xe0]],
    ['image/png', [0x89, 0x50, 0x4e, 0x47, 0x0d]],
  ])('recognises %s', (type, bytes) => {
    expect(detectDeclarationType(new Uint8Array(bytes))).toBe(type)
  })

  it('refuses text renamed to .pdf', () => {
    const text = new TextEncoder().encode('Toto není PDF.')
    expect(detectDeclarationType(text)).toBeNull()
  })

  it('refuses a file too short to tell', () => {
    expect(detectDeclarationType(new Uint8Array([0x25, 0x50]))).toBeNull()
    expect(detectDeclarationType(new Uint8Array())).toBeNull()
  })
})
