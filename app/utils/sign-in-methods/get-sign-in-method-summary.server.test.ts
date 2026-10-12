import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findUniqueOrThrow, getUserTwoFactor, countUnusedBackupCodes } =
  vi.hoisted(() => ({
    countUnusedBackupCodes: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    getUserTwoFactor: vi.fn(),
  }))

vi.mock('~/utils/db.server', () => ({
  prisma: { user: { findUniqueOrThrow } },
}))
vi.mock('~/utils/two-factor.server', () => ({ getUserTwoFactor }))
vi.mock('~/utils/backup-codes.server', () => ({ countUnusedBackupCodes }))

import { getSignInMethodSummary } from './get-sign-in-method-summary.server'

describe('getSignInMethodSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('sums up an account with every method', async () => {
    findUniqueOrThrow.mockResolvedValue({
      _count: { passkeys: 2 },
      connections: [{ id: 'connection' }],
      password: { userId: 'user' },
    })
    getUserTwoFactor.mockResolvedValue({ id: 'two-factor' })
    countUnusedBackupCodes.mockResolvedValue(6)

    await expect(getSignInMethodSummary('user')).resolves.toEqual({
      hasPassword: true,
      isGoogleLinked: true,
      isTwoFactorEnabled: true,
      passkeyCount: 2,
      unusedBackupCodesCount: 6,
    })
  })

  test('does not count backup codes while two-factor is off', async () => {
    findUniqueOrThrow.mockResolvedValue({
      _count: { passkeys: 0 },
      connections: [],
      password: null,
    })
    getUserTwoFactor.mockResolvedValue(null)

    await expect(getSignInMethodSummary('user')).resolves.toEqual({
      hasPassword: false,
      isGoogleLinked: false,
      isTwoFactorEnabled: false,
      passkeyCount: 0,
      unusedBackupCodesCount: 0,
    })
    expect(countUnusedBackupCodes).not.toHaveBeenCalled()
  })
})
