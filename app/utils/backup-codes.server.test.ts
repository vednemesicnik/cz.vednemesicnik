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

const { countUnusedBackupCodes, redeemBackupCode, regenerateBackupCodes } =
  await import('./backup-codes.server')

const USER = 'user-1'

beforeEach(() => {
  rows.length = 0
  seq.n = 0
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
