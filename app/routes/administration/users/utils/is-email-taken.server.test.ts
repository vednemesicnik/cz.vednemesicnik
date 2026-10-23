import { beforeEach, describe, expect, test, vi } from 'vitest'

import { isEmailTaken } from './is-email-taken.server'

const mocks = vi.hoisted(() => ({
  userCount: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    user: {
      count: mocks.userCount,
    },
  },
}))

const args = { email: 'admin@vednemesicnik.cz', userId: 'edited-user' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('isEmailTaken (design 28f)', () => {
  test('looks for another account by e-mail or username, never the edited one', async () => {
    mocks.userCount.mockResolvedValue(0)

    await isEmailTaken(args)

    expect(mocks.userCount).toHaveBeenCalledWith({
      where: {
        id: { not: 'edited-user' },
        OR: [
          { email: 'admin@vednemesicnik.cz' },
          { username: 'admin@vednemesicnik.cz' },
        ],
      },
    })
  })

  test('counts every account on Nový uživatel', async () => {
    mocks.userCount.mockResolvedValue(0)

    await isEmailTaken({ email: 'admin@vednemesicnik.cz' })

    expect(mocks.userCount).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: 'admin@vednemesicnik.cz' },
          { username: 'admin@vednemesicnik.cz' },
        ],
      },
    })
  })

  test('is taken when another account uses the address', async () => {
    mocks.userCount.mockResolvedValue(1)

    await expect(isEmailTaken(args)).resolves.toBe(true)
  })

  test('is free when no other account uses it', async () => {
    mocks.userCount.mockResolvedValue(0)

    await expect(isEmailTaken(args)).resolves.toBe(false)
  })
})
