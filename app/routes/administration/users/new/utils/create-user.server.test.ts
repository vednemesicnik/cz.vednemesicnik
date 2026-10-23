import { beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authorCreate: vi.fn(),
  authorFindUnique: vi.fn(),
  authorRoleFindUnique: vi.fn(),
  userCreate: vi.fn(),
}))

vi.mock('~/utils/db.server', () => {
  const transaction = {
    author: { create: mocks.authorCreate, findUnique: mocks.authorFindUnique },
    authorRole: { findUnique: mocks.authorRoleFindUnique },
    user: { create: mocks.userCreate },
  }

  return {
    prisma: {
      $transaction: (callback: (client: typeof transaction) => unknown) =>
        callback(transaction),
    },
  }
})

import { createUser } from './create-user.server'

const account = {
  email: 'veronika.pokorna@vednemesicnik.cz',
  roleId: 'member-id',
}

const expectAccountFor = (authorId: string, name: string) =>
  expect(mocks.userCreate).toHaveBeenCalledWith({
    data: {
      author: { connect: { id: authorId } },
      email: account.email,
      name,
      role: { connect: { id: 'member-id' } },
      username: account.email,
    },
    select: { id: true },
  })

describe('createUser (design 28f)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.userCreate.mockResolvedValue({ id: 'user' })
  })

  test.each(['contributor-id', 'creator-id', 'coordinator-id'])(
    'creates a new author with the chosen role %s',
    async (authorRoleId) => {
      mocks.authorRoleFindUnique.mockResolvedValue({ id: authorRoleId })
      mocks.authorCreate.mockResolvedValue({
        id: 'new-author',
        name: 'Veronika Pokorná',
      })

      const result = await createUser({
        ...account,
        authorMode: 'new',
        authorRoleId,
        name: 'Veronika Pokorná',
      })

      expect(mocks.authorCreate).toHaveBeenCalledWith({
        data: {
          name: 'Veronika Pokorná',
          role: { connect: { id: authorRoleId } },
        },
        select: { id: true, name: true },
      })
      expectAccountFor('new-author', 'Veronika Pokorná')
      expect(result).toEqual({ createdAuthorId: 'new-author', userId: 'user' })
    },
  )

  test('refuses an author role that does not exist', async () => {
    mocks.authorRoleFindUnique.mockResolvedValue(null)

    await expect(
      createUser({
        ...account,
        authorMode: 'new',
        authorRoleId: 'gone',
        name: 'Veronika Pokorná',
      }),
    ).rejects.toMatchObject({ init: { status: 400 } })
    expect(mocks.userCreate).not.toHaveBeenCalled()
  })

  test('gives an existing author without an account the account, named after them', async () => {
    mocks.authorFindUnique.mockResolvedValue({
      id: 'pavel',
      name: 'Pavel Říha',
    })

    const result = await createUser({
      ...account,
      authorMode: 'existing',
      existingAuthorId: 'pavel',
    })

    expect(mocks.authorFindUnique).toHaveBeenCalledWith({
      select: { id: true, name: true },
      where: { id: 'pavel', user: null },
    })
    expect(mocks.authorCreate).not.toHaveBeenCalled()
    expectAccountFor('pavel', 'Pavel Říha')
    expect(result).toEqual({ createdAuthorId: null, userId: 'user' })
  })

  test('refuses an existing author who has an account by now', async () => {
    mocks.authorFindUnique.mockResolvedValue(null)

    await expect(
      createUser({
        ...account,
        authorMode: 'existing',
        existingAuthorId: 'pavel',
      }),
    ).rejects.toMatchObject({ init: { status: 400 } })
    expect(mocks.userCreate).not.toHaveBeenCalled()
  })
})
