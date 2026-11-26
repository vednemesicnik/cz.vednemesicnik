import { Prisma } from '@generated/prisma/client'
import { describe, expect, test, vi } from 'vitest'

import { readEditHeldRefusal } from './read-edit-held-refusal'
import { refuseWhenHeld } from './refuse-when-held.server'

const notFound = () =>
  new Prisma.PrismaClientKnownRequestError('No record', {
    clientVersion: 'test',
    code: 'P2025',
  })

describe('refuseWhenHeld', () => {
  test('passes a successful write through', async () => {
    await expect(refuseWhenHeld(async () => 'written', vi.fn())).resolves.toBe(
      'written',
    )
  })

  test('a write someone else’s hold stopped becomes the held refusal', async () => {
    const refusal = await refuseWhenHeld(
      () => Promise.reject(notFound()),
      async () => ({ heldByName: 'Jakub Novák', isOwnOtherTab: false }),
    ).catch((error: unknown) => error)

    expect(refusal).toMatchObject({ init: { status: 409 } })
    expect(readEditHeldRefusal(refusal)).toEqual({
      heldByName: 'Jakub Novák',
      isOwnOtherTab: false,
    })
  })

  test('a hold that ended before the read-back: the write runs once more', async () => {
    const write = vi
      .fn()
      .mockRejectedValueOnce(notFound())
      .mockResolvedValueOnce('written')

    await expect(refuseWhenHeld(write, async () => null)).resolves.toBe(
      'written',
    )
    expect(write).toHaveBeenCalledTimes(2)
  })

  test('a miss with nobody holding it twice, and any other failure, go on as they were', async () => {
    const missing = notFound()
    await expect(
      refuseWhenHeld(
        () => Promise.reject(missing),
        async () => null,
      ),
    ).rejects.toBe(missing)

    const failure = new Error('disk full')
    const findRefusal = vi.fn()
    await expect(
      refuseWhenHeld(() => Promise.reject(failure), findRefusal),
    ).rejects.toBe(failure)
    expect(findRefusal).not.toHaveBeenCalled()
  })
})
