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
      async () => 'Jakub Novák',
    ).catch((error: unknown) => error)

    expect(refusal).toMatchObject({ init: { status: 409 } })
    expect(readEditHeldRefusal(refusal)).toBe('Jakub Novák')
  })

  test('a miss with nobody holding it, and any other failure, go on as they were', async () => {
    const missing = notFound()
    await expect(
      refuseWhenHeld(
        () => Promise.reject(missing),
        async () => null,
      ),
    ).rejects.toBe(missing)

    const failure = new Error('disk full')
    const findHeldByName = vi.fn()
    await expect(
      refuseWhenHeld(() => Promise.reject(failure), findHeldByName),
    ).rejects.toBe(failure)
    expect(findHeldByName).not.toHaveBeenCalled()
  })
})

describe('readEditHeldRefusal', () => {
  test('ignores what is not a held refusal', () => {
    expect(readEditHeldRefusal(new Error('x'))).toBeNull()
    expect(
      readEditHeldRefusal({ data: null, init: { status: 403 } }),
    ).toBeNull()
    expect(readEditHeldRefusal(new Response(null, { status: 409 }))).toBeNull()
  })
})
