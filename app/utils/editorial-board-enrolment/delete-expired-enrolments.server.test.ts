import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ENROLMENT_VERIFICATION_TYPE } from '~/config/editorial-board-enrolment-config'

const { deleteMany } = vi.hoisted(() => ({
  deleteMany: vi.fn(async (_args: unknown) => ({ count: 0 })),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { verification: { deleteMany } },
}))

import { deleteExpiredEnrolments } from './delete-expired-enrolments.server'

describe('deleteExpiredEnrolments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes only expired rows of the enrolment type', () => {
    const before = Date.now()

    deleteExpiredEnrolments()

    const args = deleteMany.mock.lastCall?.[0] as {
      where: { expiresAt: { lt: Date }; type: string }
    }
    const { where } = args

    expect(where.type).toBe(ENROLMENT_VERIFICATION_TYPE)
    expect(where.expiresAt.lt.getTime()).toBeGreaterThanOrEqual(before)
  })

  it('logs a failure instead of throwing', async () => {
    const error = new Error('database is locked')
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    deleteMany.mockRejectedValueOnce(error)

    deleteExpiredEnrolments()

    await vi.waitFor(() => {
      expect(log).toHaveBeenCalledWith(
        'Failed to delete expired enrolments',
        error,
      )
    })
  })
})
