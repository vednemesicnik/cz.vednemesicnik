import bcrypt from 'bcryptjs'
import { describe, expect, test } from 'vitest'

import {
  BACKUP_CODE_COUNT,
  canonicalizeBackupCode,
  createBackupCodeSet,
  matchBackupCodeHash,
} from '~/utils/backup-codes'

describe('createBackupCodeSet', () => {
  test('generates the expected number of codes', () => {
    expect(createBackupCodeSet()).toHaveLength(BACKUP_CODE_COUNT)
  })

  test('formats every code as xxxx-xxxx from the unambiguous alphabet', () => {
    for (const { code } of createBackupCodeSet()) {
      expect(code).toMatch(
        /^[23456789abcdefghjkmnpqrstuvwxyz]{4}-[23456789abcdefghjkmnpqrstuvwxyz]{4}$/,
      )
    }
  })

  test('produces unique codes', () => {
    const codes = createBackupCodeSet().map(({ code }) => code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  test('each hash verifies against its own code but not another', () => {
    const [first, second] = createBackupCodeSet()

    expect(
      bcrypt.compareSync(canonicalizeBackupCode(first.code), first.hash),
    ).toBe(true)
    expect(
      bcrypt.compareSync(canonicalizeBackupCode(second.code), first.hash),
    ).toBe(false)
  })
})

describe('canonicalizeBackupCode', () => {
  test('lowercases and strips separators', () => {
    expect(canonicalizeBackupCode('K7M2-9XQP')).toBe('k7m29xqp')
    expect(canonicalizeBackupCode('  k7m2 9xqp ')).toBe('k7m29xqp')
  })
})

describe('matchBackupCodeHash', () => {
  const set = createBackupCodeSet()
  const hashes = set.map(({ hash }) => hash)

  test('returns the index of a valid code regardless of formatting', () => {
    const target = set[2]

    expect(matchBackupCodeHash(target.code, hashes)).toBe(2)
    // Same code entered without the dash and upper-cased still matches.
    expect(
      matchBackupCodeHash(target.code.replace('-', '').toUpperCase(), hashes),
    ).toBe(2)
  })

  test('returns -1 for an unknown code', () => {
    expect(matchBackupCodeHash('zzzz-zzzz', hashes)).toBe(-1)
  })

  test('returns -1 when a used code is dropped from the candidate hashes', () => {
    const target = set[0]
    const remaining = hashes.filter((hash) => hash !== target.hash)

    expect(matchBackupCodeHash(target.code, remaining)).toBe(-1)
  })
})
