import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { decryptToken, encryptToken } from './token-cipher.server.ts'

const KEY = Buffer.alloc(32, 1)

describe('the token cipher', () => {
  it('reads back what it wrote, and never writes the token itself', () => {
    let stored = encryptToken('1//test-refresh-token', KEY)
    assert.ok(!stored.includes('test-refresh-token'))
    assert.notEqual(stored, encryptToken('1//test-refresh-token', KEY), 'a fresh IV every time')
    assert.equal(decryptToken(stored, KEY), '1//test-refresh-token')
  })

  it('refuses a value that was altered or written under another key', () => {
    let stored = encryptToken('1//test-refresh-token', KEY)
    let bytes = Buffer.from(stored, 'base64')
    bytes[bytes.length - 1] = (bytes[bytes.length - 1] ?? 0) ^ 1

    assert.throws(() => decryptToken(bytes.toString('base64'), KEY))
    assert.throws(() => decryptToken(stored, Buffer.alloc(32, 2)))
    assert.throws(() => decryptToken('', KEY))
  })
})
