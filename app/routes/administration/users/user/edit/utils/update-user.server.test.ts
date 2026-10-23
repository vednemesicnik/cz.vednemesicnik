import { beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  userFindUniqueOrThrow: vi.fn(),
  userUpdate: vi.fn(),
  userUpdateMany: vi.fn(),
}))

vi.mock('~/utils/db.server', () => {
  const transaction = {
    user: {
      findUniqueOrThrow: mocks.userFindUniqueOrThrow,
      update: mocks.userUpdate,
      updateMany: mocks.userUpdateMany,
    },
  }

  return {
    prisma: {
      $transaction: (callback: (client: typeof transaction) => unknown) =>
        callback(transaction),
    },
  }
})

import { updateUser } from './update-user.server'

const options = {
  email: 'jakub.novak@vednemesicnik.cz',
  userId: 'user',
}

const administrator = { id: 'administrator-id', name: 'administrator' as const }
const member = { id: 'member-id', name: 'member' as const }

const storeRole = (role: { id: string; name: string }) =>
  mocks.userFindUniqueOrThrow.mockResolvedValueOnce({ role })

const expectEmailSaved = () =>
  expect(mocks.userUpdate).toHaveBeenCalledWith({
    data: { email: options.email, username: options.email },
    where: { id: 'user' },
  })

describe('updateUser (design 28f, log 0041)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('saves the e-mail without a role change', async () => {
    storeRole(member)

    const result = await updateUser({
      ...options,
      role: { ...member, loadedRoleId: 'member-id' },
    })

    expect(result).toEqual({ status: 'saved' })
    expectEmailSaved()
    expect(mocks.userUpdateMany).not.toHaveBeenCalled()
  })

  test("saves the Owner's e-mail, which sends no role", async () => {
    storeRole({ id: 'owner-id', name: 'owner' })

    const result = await updateUser({ ...options, role: null })

    expect(result).toEqual({ status: 'saved' })
    expectEmailSaved()
    expect(mocks.userUpdateMany).not.toHaveBeenCalled()
  })

  test('changes the role while it is still the loaded one', async () => {
    storeRole(member)
    mocks.userUpdateMany.mockResolvedValue({ count: 1 })

    const result = await updateUser({
      ...options,
      role: { ...administrator, loadedRoleId: 'member-id' },
    })

    expect(result).toEqual({
      previousRoleName: 'member',
      roleName: 'administrator',
      status: 'role-changed',
    })
    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      data: { roleId: 'administrator-id' },
      where: { id: 'user', roleId: 'member-id' },
    })
  })

  test('holds the role back when it changed before the save, the e-mail not', async () => {
    storeRole(administrator)

    const result = await updateUser({
      ...options,
      role: { ...administrator, loadedRoleId: 'member-id' },
    })

    expect(result).toEqual({
      currentRoleId: 'administrator-id',
      currentRoleName: 'administrator',
      status: 'role-conflict',
    })
    expectEmailSaved()
    expect(mocks.userUpdateMany).not.toHaveBeenCalled()
  })

  test('holds the role back when it changed during the save', async () => {
    storeRole(member)
    storeRole(administrator)
    mocks.userUpdateMany.mockResolvedValue({ count: 0 })

    const result = await updateUser({
      ...options,
      role: { ...administrator, loadedRoleId: 'member-id' },
    })

    expect(result).toEqual({
      currentRoleId: 'administrator-id',
      currentRoleName: 'administrator',
      status: 'role-conflict',
    })
    expectEmailSaved()
  })
})
