import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ENROLMENT_VERIFICATION_TYPE } from '~/config/editorial-board-enrolment-config'
import { getContentHash } from '~/utils/hash.server'

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }))

vi.mock('~/utils/db.server', () => ({
  prisma: { verification: { findFirst } },
}))

import { findEnrolmentByToken } from './find-enrolment-by-token.server'

const PAYLOAD = {
  formSubmittedAt: '2026-11-03T10:00:00.000Z',
  name: 'Tereza Malá',
}

describe('findEnrolmentByToken', () => {
  beforeEach(() => {
    findFirst.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('looks an unexpired row up by the hash of the token, of its own type', async () => {
    findFirst.mockResolvedValue(null)

    await expect(findEnrolmentByToken('token')).resolves.toBeNull()

    expect(findFirst).toHaveBeenCalledExactlyOnceWith({
      select: { payload: true, target: true },
      where: {
        expiresAt: { gt: expect.any(Date) },
        secret: getContentHash('token'),
        type: ENROLMENT_VERIFICATION_TYPE,
      },
    })
  })

  it('answers the address and the payload', async () => {
    findFirst.mockResolvedValue({
      payload: JSON.stringify(PAYLOAD),
      target: 'tereza@local.dev',
    })

    await expect(findEnrolmentByToken('token')).resolves.toEqual({
      email: 'tereza@local.dev',
      payload: PAYLOAD,
    })
  })

  it('counts a payload of the wrong shape as unknown', async () => {
    findFirst.mockResolvedValue({
      payload: JSON.stringify({ name: 'Tereza Malá' }),
      target: 'tereza@local.dev',
    })

    await expect(findEnrolmentByToken('token')).resolves.toBeNull()
  })

  it('counts a payload that is not JSON as unknown', async () => {
    findFirst.mockResolvedValue({ payload: '{', target: 'tereza@local.dev' })

    await expect(findEnrolmentByToken('token')).resolves.toBeNull()
  })

  it('counts a missing payload as unknown', async () => {
    findFirst.mockResolvedValue({ payload: null, target: 'tereza@local.dev' })

    await expect(findEnrolmentByToken('token')).resolves.toBeNull()
  })

  it('leaves a database failure to the caller', async () => {
    findFirst.mockRejectedValue(new Error('database is locked'))

    await expect(findEnrolmentByToken('token')).rejects.toThrow(
      'database is locked',
    )
  })
})
