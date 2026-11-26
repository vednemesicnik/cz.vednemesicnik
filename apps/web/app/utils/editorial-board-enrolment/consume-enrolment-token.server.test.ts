import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ENROLMENT_VERIFICATION_TYPE } from '~/config/editorial-board-enrolment-config'
import { getContentHash } from '~/utils/hash.server'

const { deleteMany } = vi.hoisted(() => ({ deleteMany: vi.fn() }))

vi.mock('~/utils/db.server', () => ({
  prisma: { verification: { deleteMany } },
}))

import { consumeEnrolmentToken } from './consume-enrolment-token.server'

describe('consumeEnrolmentToken', () => {
  beforeEach(() => {
    deleteMany.mockReset()
  })

  it('deletes an unexpired row by the hash of the token, of its own type', async () => {
    deleteMany.mockResolvedValue({ count: 1 })

    await expect(consumeEnrolmentToken('token')).resolves.toBe(true)

    expect(deleteMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        expiresAt: { gt: expect.any(Date) },
        secret: getContentHash('token'),
        type: ENROLMENT_VERIFICATION_TYPE,
      },
    })
  })

  it('answers false when another press spent it first', async () => {
    deleteMany.mockResolvedValue({ count: 0 })

    await expect(consumeEnrolmentToken('token')).resolves.toBe(false)
  })

  it('leaves a database failure to the caller', async () => {
    deleteMany.mockRejectedValue(new Error('database is locked'))

    await expect(consumeEnrolmentToken('token')).rejects.toThrow(
      'database is locked',
    )
  })
})
