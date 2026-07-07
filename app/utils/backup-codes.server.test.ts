import bcrypt from 'bcryptjs'
import { beforeEach, describe, expect, test, vi } from 'vitest'

type Row = { id: string; codeHash: string; usedAt: Date | null; userId: string }

// In-memory stand-in for the BackupCode table. The helpers run for real, so
// these tests cover single-use redemption and invalidate-all regeneration
// (including the conditional updateMany that guards against double redemption).
const { rows, seq } = vi.hoisted(() => ({ rows: [] as Row[], seq: { n: 0 } }))

const matchUser = (row: Row, where: { userId: string; usedAt?: null }) =>
  row.userId === where.userId &&
  (where.usedAt === null ? row.usedAt === null : true)

vi.mock('~/utils/db.server', () => ({
  prisma: {
    $transaction: async (ops: Promise<unknown>[]) => Promise.all(ops),
    backupCode: {
      count: async ({ where }: { where: { userId: string; usedAt?: null } }) =>
        rows.filter((row) => matchUser(row, where)).length,
      createMany: async ({
        data,
      }: {
        data: { codeHash: string; userId: string }[]
      }) => {
        for (const item of data) {
          rows.push({ id: `id-${seq.n++}`, usedAt: null, ...item })
        }
        return { count: data.length }
      },
      deleteMany: async ({ where }: { where: { userId: string } }) => {
        let count = 0
        for (let i = rows.length - 1; i >= 0; i--) {
          if (rows[i].userId === where.userId) {
            rows.splice(i, 1)
            count++
          }
        }
        return { count }
      },
      findMany: async ({
        where,
      }: {
        where: { userId: string; usedAt?: null }
      }) =>
        rows
          .filter((row) => matchUser(row, where))
          .map(({ codeHash, id }) => ({ codeHash, id })),
      updateMany: async ({
        data,
        where,
      }: {
        data: { usedAt: Date }
        where: { id: string; usedAt: null }
      }) => {
        let count = 0
        for (const row of rows) {
          if (row.id === where.id && row.usedAt === null) {
            row.usedAt = data.usedAt
            count++
          }
        }
        return { count }
      },
    },
  },
}))

const {
  BACKUP_CODE_COUNT,
  canonicalizeBackupCode,
  countUnusedBackupCodes,
  createBackupCodeSet,
  matchBackupCodeHash,
  redeemBackupCode,
  regenerateBackupCodes,
} = await import('./backup-codes.server')

const USER = 'user-1'

beforeEach(() => {
  rows.length = 0
  seq.n = 0
})

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
  test('matches a valid code regardless of formatting and rejects others', () => {
    const set = createBackupCodeSet()
    const hashes = set.map(({ hash }) => hash)
    const target = set[2]

    expect(matchBackupCodeHash(target.code, hashes)).toBe(2)
    // Same code without the dash and upper-cased still matches.
    expect(
      matchBackupCodeHash(target.code.replace('-', '').toUpperCase(), hashes),
    ).toBe(2)
    expect(matchBackupCodeHash('zzzz-zzzz', hashes)).toBe(-1)
    // A consumed code dropped from the candidate hashes no longer matches.
    expect(
      matchBackupCodeHash(
        target.code,
        hashes.filter((hash) => hash !== target.hash),
      ),
    ).toBe(-1)
  })
})

describe('backup codes persistence', () => {
  test('regeneration issues a full set of unused codes', async () => {
    const codes = await regenerateBackupCodes(USER)

    expect(codes).toHaveLength(10)
    expect(await countUnusedBackupCodes(USER)).toBe(10)
  })

  test('a valid code redeems once and is then single-use', async () => {
    const codes = await regenerateBackupCodes(USER)

    expect(await redeemBackupCode(USER, codes[0])).toBe(true)
    // Second attempt with the same code is rejected.
    expect(await redeemBackupCode(USER, codes[0])).toBe(false)
    // A different code still works; the count drops accordingly.
    expect(await redeemBackupCode(USER, codes[1])).toBe(true)
    expect(await countUnusedBackupCodes(USER)).toBe(8)
  })

  test('an unknown code does not redeem', async () => {
    await regenerateBackupCodes(USER)

    expect(await redeemBackupCode(USER, 'zzzz-zzzz')).toBe(false)
    expect(await countUnusedBackupCodes(USER)).toBe(10)
  })

  test('regeneration invalidates the previous set', async () => {
    const first = await regenerateBackupCodes(USER)
    const second = await regenerateBackupCodes(USER)

    expect(await redeemBackupCode(USER, first[0])).toBe(false)
    expect(await redeemBackupCode(USER, second[0])).toBe(true)
    expect(await countUnusedBackupCodes(USER)).toBe(9)
  })
})
