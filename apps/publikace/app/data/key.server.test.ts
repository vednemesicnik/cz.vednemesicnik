import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { isFormKey, isKey, newKey } from './key.server.ts'

const UUID = '0b7e3c1a-5d2f-4a8e-9c6b-1f2e3d4c5b6a'

describe('the keys the app makes', () => {
  it('makes a 24-character CUID that passes as a key and as a form key', () => {
    let key = newKey()
    assert.equal(key.length, 24)
    assert.ok(isKey(key))
    assert.ok(isFormKey(key))
    assert.notEqual(newKey(), key)
  })

  it('takes a UUID as a form key only, for a page drawn before the CUID keys (#1140)', () => {
    assert.ok(isFormKey(UUID))
    assert.ok(!isKey(UUID))
  })

  it('refuses what neither a key nor a form key can be', () => {
    let refused: unknown[] = [
      '',
      'seeded-batch-1',
      UUID.toUpperCase(),
      newKey().slice(1),
      `${newKey()}a`,
      newKey().toUpperCase(),
      null,
      24,
    ]
    for (let value of refused) {
      assert.ok(!isKey(value), String(value))
      assert.ok(!isFormKey(value), String(value))
    }
  })
})
