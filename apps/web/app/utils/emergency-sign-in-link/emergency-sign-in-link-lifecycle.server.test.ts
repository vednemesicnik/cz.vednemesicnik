import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

type Row = {
  id: string
  tokenHash: string
  userId: string
  issuedById: string
  createdAt: Date
  expiresAt: Date
  usedAt: Date | null
  replacedAt: Date | null
}

type Where = {
  tokenHash?: string
  userId?: string
  usedAt?: null
  replacedAt?: null
  expiresAt?: { gt: Date }
}

// In-memory stand-in for the EmergencySignInLink table. The link helpers run
// for real, so these tests cover the hashing, expiry, single use and
// replacement.
const { rows } = vi.hoisted(() => ({ rows: [] as Row[] }))

const matches = (row: Row, where: Where) =>
  (where.tokenHash === undefined || row.tokenHash === where.tokenHash) &&
  (where.userId === undefined || row.userId === where.userId) &&
  (where.usedAt === undefined || row.usedAt === null) &&
  (where.replacedAt === undefined || row.replacedAt === null) &&
  (where.expiresAt === undefined || row.expiresAt > where.expiresAt.gt)

vi.mock('~/utils/db.server', () => ({
  prisma: {
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
    emergencySignInLink: {
      create: async ({
        data,
      }: {
        data: Pick<Row, 'expiresAt' | 'issuedById' | 'tokenHash' | 'userId'>
      }) => {
        const row: Row = {
          ...data,
          createdAt: new Date(),
          id: `link-${rows.length + 1}`,
          replacedAt: null,
          usedAt: null,
        }
        rows.push(row)
        return row
      },
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        const row = rows.find(
          (candidate) => candidate.tokenHash === where.tokenHash,
        )
        return row === undefined
          ? null
          : { ...row, user: { email: `${row.userId}@vednemesicnik.cz` } }
      },
      updateMany: async ({
        data,
        where,
      }: {
        data: Partial<Row>
        where: Where
      }) => {
        const matching = rows.filter((row) => matches(row, where))
        for (const row of matching) Object.assign(row, data)
        return { count: matching.length }
      },
    },
  },
}))

import { consumeEmergencySignInLink } from './consume-emergency-sign-in-link.server'
import { findEmergencySignInLink } from './find-emergency-sign-in-link.server'
import { issueEmergencySignInLink } from './issue-emergency-sign-in-link.server'

const issue = () =>
  issueEmergencySignInLink({ issuedById: 'admin', userId: 'member' })

describe('emergency sign-in link', () => {
  beforeEach(() => {
    rows.length = 0
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-12T12:20:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('stores only the hash, with the issuer, valid for 15 minutes', async () => {
    const { expiresAt, token } = await issue()

    expect(rows).toHaveLength(1)
    expect(rows[0].tokenHash).not.toContain(token)
    expect(rows[0].tokenHash).toMatch(/^[0-9a-f]{64}$/)
    expect(rows[0].issuedById).toBe('admin')
    expect(expiresAt.toISOString()).toBe('2026-10-12T12:35:00.000Z')
  })

  test('signs in once only', async () => {
    const { token } = await issue()

    expect(await consumeEmergencySignInLink(token)).toBe(true)
    expect(await consumeEmergencySignInLink(token)).toBe(false)
    expect((await findEmergencySignInLink(token))?.isValid).toBe(false)
  })

  test('stops working after 15 minutes', async () => {
    const { token } = await issue()

    vi.setSystemTime(new Date('2026-10-12T12:35:00.000Z'))

    expect((await findEmergencySignInLink(token))?.isValid).toBe(false)
    expect(await consumeEmergencySignInLink(token)).toBe(false)
  })

  test('a new link replaces the previous one', async () => {
    const previous = await issue()
    const next = await issue()

    expect(await consumeEmergencySignInLink(previous.token)).toBe(false)
    expect(rows[0].replacedAt).not.toBeNull()
    expect(await consumeEmergencySignInLink(next.token)).toBe(true)
  })

  test('an expired, used or replaced link still names its account', async () => {
    const { token } = await issue()
    await issue()

    expect(await findEmergencySignInLink(token)).toEqual({
      email: 'member@vednemesicnik.cz',
      id: 'link-1',
      issuedById: 'admin',
      isValid: false,
      userId: 'member',
    })
  })

  test('an unknown token is no link', async () => {
    await issue()

    expect(await findEmergencySignInLink('unknown')).toBeNull()
    expect(await consumeEmergencySignInLink('unknown')).toBe(false)
  })
})
