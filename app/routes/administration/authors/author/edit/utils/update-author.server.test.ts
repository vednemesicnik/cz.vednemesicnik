import { beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authorFindUniqueOrThrow: vi.fn(),
  authorRoleFindUnique: vi.fn(),
  authorUpdate: vi.fn(),
  authorUpdateMany: vi.fn(),
}))

vi.mock('~/utils/db.server', () => {
  const transaction = {
    author: {
      findUniqueOrThrow: mocks.authorFindUniqueOrThrow,
      update: mocks.authorUpdate,
      updateMany: mocks.authorUpdateMany,
    },
    authorRole: { findUnique: mocks.authorRoleFindUnique },
  }

  return {
    prisma: {
      $transaction: (callback: (client: typeof transaction) => unknown) =>
        callback(transaction),
    },
  }
})

import { updateAuthor } from './update-author.server'

const options = {
  authorId: 'author',
  bio: 'Fotí a píše reportáže.',
  name: 'Jakub Novák',
}

const storeRole = (id: string, name: string) =>
  mocks.authorFindUniqueOrThrow.mockResolvedValueOnce({ role: { id, name } })

describe('updateAuthor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('saves name and bio without a role change', async () => {
    storeRole('creator-id', 'creator')

    const result = await updateAuthor({
      ...options,
      loadedRoleId: 'creator-id',
      roleId: 'creator-id',
    })

    expect(result).toEqual({ status: 'saved' })
    expect(mocks.authorUpdate).toHaveBeenCalledWith({
      data: { bio: options.bio, name: options.name },
      where: { id: 'author' },
    })
    expect(mocks.authorUpdateMany).not.toHaveBeenCalled()
  })

  test('writes a new role while the stored one is the loaded one', async () => {
    storeRole('creator-id', 'creator')
    mocks.authorRoleFindUnique.mockResolvedValue({ name: 'coordinator' })
    mocks.authorUpdateMany.mockResolvedValue({ count: 1 })

    const result = await updateAuthor({
      ...options,
      loadedRoleId: 'creator-id',
      roleId: 'coordinator-id',
    })

    expect(mocks.authorUpdateMany).toHaveBeenCalledWith({
      data: { roleId: 'coordinator-id' },
      where: { id: 'author', roleId: 'creator-id' },
    })
    expect(result).toEqual({
      previousRoleName: 'creator',
      roleName: 'coordinator',
      status: 'role-changed',
    })
  })

  test('keeps the role changed meanwhile, saving name and bio', async () => {
    storeRole('coordinator-id', 'coordinator')

    const result = await updateAuthor({
      ...options,
      loadedRoleId: 'creator-id',
      roleId: 'contributor-id',
    })

    expect(result).toEqual({
      currentRoleId: 'coordinator-id',
      currentRoleName: 'coordinator',
      status: 'role-conflict',
    })
    expect(mocks.authorUpdate).toHaveBeenCalled()
    expect(mocks.authorUpdateMany).not.toHaveBeenCalled()
  })

  test('reports a collision even when the form kept the loaded role', async () => {
    storeRole('coordinator-id', 'coordinator')

    const result = await updateAuthor({
      ...options,
      loadedRoleId: 'creator-id',
      roleId: 'creator-id',
    })

    expect(result).toEqual({
      currentRoleId: 'coordinator-id',
      currentRoleName: 'coordinator',
      status: 'role-conflict',
    })
  })

  test('reports a collision when the role changes between the read and the write', async () => {
    storeRole('creator-id', 'creator')
    mocks.authorRoleFindUnique.mockResolvedValue({ name: 'coordinator' })
    mocks.authorUpdateMany.mockResolvedValue({ count: 0 })
    mocks.authorFindUniqueOrThrow.mockResolvedValueOnce({
      role: { id: 'contributor-id', name: 'contributor' },
    })

    const result = await updateAuthor({
      ...options,
      loadedRoleId: 'creator-id',
      roleId: 'coordinator-id',
    })

    expect(result).toEqual({
      currentRoleId: 'contributor-id',
      currentRoleName: 'contributor',
      status: 'role-conflict',
    })
  })

  test('refuses a role that does not exist', async () => {
    storeRole('creator-id', 'creator')
    mocks.authorRoleFindUnique.mockResolvedValue(null)

    await expect(
      updateAuthor({
        ...options,
        loadedRoleId: 'creator-id',
        roleId: 'made-up',
      }),
    ).rejects.toMatchObject({ init: { status: 400 } })
    expect(mocks.authorUpdateMany).not.toHaveBeenCalled()
  })
})
