import { beforeEach, describe, expect, test, vi } from 'vitest'

import { findEmailOwner } from './find-email-owner.server'

const mocks = vi.hoisted(() => ({
  userFindFirst: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    user: {
      findFirst: mocks.userFindFirst,
    },
  },
}))

const args = { email: 'admin@vednemesicnik.cz', userId: 'edited-user' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('findEmailOwner (design 28e)', () => {
  test('looks for another account by e-mail or username, never the edited one', async () => {
    mocks.userFindFirst.mockResolvedValue(null)

    await findEmailOwner(args)

    expect(mocks.userFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: { not: 'edited-user' },
          OR: [
            { email: 'admin@vednemesicnik.cz' },
            { username: 'admin@vednemesicnik.cz' },
          ],
        },
      }),
    )
  })

  test('names the other account by its author', async () => {
    mocks.userFindFirst.mockResolvedValue({
      author: { name: 'Admin' },
      id: 'local-admin-user',
    })

    await expect(findEmailOwner(args)).resolves.toEqual({
      name: 'Admin',
      userId: 'local-admin-user',
    })
  })

  test('returns null when no other account uses the address', async () => {
    mocks.userFindFirst.mockResolvedValue(null)

    await expect(findEmailOwner(args)).resolves.toBeNull()
  })
})
