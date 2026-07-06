import { beforeEach, describe, expect, test, vi } from 'vitest'

type Row = { expiresAt: Date | null; secret: string }

// In-memory stand-in for the Verification table, keyed by `${target}::${type}`.
// The magic-link helpers run for real, so these tests cover the token hashing,
// expiry and single-use deletion.
const { rows } = vi.hoisted(() => ({ rows: new Map<string, Row>() }))

const keyOf = (target: string, type: string) => `${target}::${type}`

vi.mock('~/utils/db.server', () => ({
  prisma: {
    verification: {
      deleteMany: async ({
        where,
      }: {
        where: { target: string; type: string }
      }) => {
        rows.delete(keyOf(where.target, where.type))
      },
      findUnique: async ({
        where,
      }: {
        where: { target_type: { target: string; type: string } }
      }) => {
        const { target, type } = where.target_type
        return rows.get(keyOf(target, type)) ?? null
      },
      upsert: async ({
        create,
        update,
        where,
      }: {
        create: Row & { target: string; type: string }
        update: Row
        where: { target_type: { target: string; type: string } }
      }) => {
        const { target, type } = where.target_type
        const key = keyOf(target, type)
        const existing = rows.get(key)
        rows.set(key, existing ? { ...existing, ...update } : create)
      },
    },
  },
}))

const { consumeMagicLinkToken, createMagicLinkToken, verifyMagicLinkToken } =
  await import('./magic-link.server')

const EMAIL = 'user@vednemesicnik.cz'

beforeEach(() => {
  rows.clear()
})

describe('magic-link token round-trip', () => {
  test('a freshly issued token verifies', async () => {
    const token = await createMagicLinkToken(EMAIL)

    expect(await verifyMagicLinkToken(EMAIL, token)).toBe(true)
  })

  test('a wrong token does not verify', async () => {
    await createMagicLinkToken(EMAIL)

    expect(await verifyMagicLinkToken(EMAIL, 'not-the-token')).toBe(false)
  })

  test('consuming a token signs in and is single-use', async () => {
    const token = await createMagicLinkToken(EMAIL)

    expect(await consumeMagicLinkToken(EMAIL, token)).toBe(true)
    // Row deleted → a second verify/consume fails.
    expect(await verifyMagicLinkToken(EMAIL, token)).toBe(false)
    expect(await consumeMagicLinkToken(EMAIL, token)).toBe(false)
  })

  test('an expired token does not verify', async () => {
    const token = await createMagicLinkToken(EMAIL)

    vi.useFakeTimers()
    try {
      // Jump past the 15-minute TTL.
      vi.setSystemTime(new Date(Date.now() + 16 * 60 * 1000))
      expect(await verifyMagicLinkToken(EMAIL, token)).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  test('requesting a new token invalidates the previous one', async () => {
    const first = await createMagicLinkToken(EMAIL)
    const second = await createMagicLinkToken(EMAIL)

    expect(await verifyMagicLinkToken(EMAIL, first)).toBe(false)
    expect(await verifyMagicLinkToken(EMAIL, second)).toBe(true)
  })
})
