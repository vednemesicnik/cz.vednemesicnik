import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ENROLMENT_TOKEN_TTL_MS,
  ENROLMENT_VERIFICATION_TYPE,
} from '~/config/editorial-board-enrolment-config'
import { getContentHash } from '~/utils/hash.server'

const { upsert } = vi.hoisted(() => ({
  upsert: vi.fn(async (_args: unknown) => ({})),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { verification: { upsert } },
}))

import { createEnrolmentToken } from './create-enrolment-token.server'

const EMAIL = 'tereza@local.dev'
const PAYLOAD = {
  formSubmittedAt: '2026-11-03T10:00:00.000Z',
  interest: 'psaní',
  name: 'Tereza Malá',
}

type UpsertArgs = {
  create: Record<string, unknown>
  update: Record<string, unknown>
  where: unknown
}

const lastUpsert = () => upsert.mock.lastCall?.[0] as UpsertArgs

describe('createEnrolmentToken', () => {
  beforeEach(() => {
    upsert.mockClear()
  })

  it('stores the hash of the token, never the token', async () => {
    const token = await createEnrolmentToken(EMAIL, PAYLOAD)
    const { create } = lastUpsert()

    expect(token).toMatch(/^[\w-]{43}$/)
    expect(create.secret).toBe(getContentHash(token))
  })

  it('stores the payload with a 72-hour expiry under the address', async () => {
    const before = Date.now()

    await createEnrolmentToken(EMAIL, PAYLOAD)

    const { create } = lastUpsert()

    expect(create.target).toBe(EMAIL)
    expect(create.type).toBe(ENROLMENT_VERIFICATION_TYPE)
    expect(JSON.parse(create.payload as string)).toEqual(PAYLOAD)
    expect((create.expiresAt as Date).getTime()).toBeGreaterThanOrEqual(
      before + ENROLMENT_TOKEN_TTL_MS,
    )
  })

  it('replaces the token, the payload and the expiry of an earlier request', async () => {
    const token = await createEnrolmentToken(EMAIL, PAYLOAD)
    const { update, where } = lastUpsert()

    expect(where).toEqual({
      target_type: { target: EMAIL, type: ENROLMENT_VERIFICATION_TYPE },
    })
    expect(update).toEqual({
      expiresAt: expect.any(Date),
      payload: JSON.stringify(PAYLOAD),
      secret: getContentHash(token),
    })
  })

  it('leaves a database failure to the caller', async () => {
    upsert.mockRejectedValueOnce(new Error('database is locked'))

    await expect(createEnrolmentToken(EMAIL, PAYLOAD)).rejects.toThrow(
      'database is locked',
    )
  })
})
