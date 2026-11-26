import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getAuthorOptions } from './get-author-options.server'

const mocks = vi.hoisted(() => ({
  authorFindFirst: vi.fn(),
  authorFindMany: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    author: {
      findFirst: mocks.authorFindFirst,
      findMany: mocks.authorFindMany,
    },
  },
}))

const authors = [
  {
    id: 'author-1',
    name: 'Tereza Malá',
    role: { name: 'creator' },
    user: null,
  },
  {
    id: 'association',
    name: 'Vedneměsíčník, z. s.',
    role: { name: 'coordinator' },
    user: { image: null },
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mocks.authorFindMany.mockResolvedValue(authors)
})

describe('getAuthorOptions (design 24j, log 0026)', () => {
  test('marks the association and gives it no role', async () => {
    mocks.authorFindFirst.mockResolvedValue({ id: 'association' })

    const options = await getAuthorOptions()

    expect(options).toEqual([
      expect.objectContaining({
        id: 'author-1',
        isAssociation: false,
        name: 'Tereza Malá',
        roleLabel: 'Tvůrce',
      }),
      expect.objectContaining({
        id: 'association',
        isAssociation: true,
        roleLabel: null,
      }),
    ])
    expect(mocks.authorFindFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { user: { role: { name: 'owner' } } },
    })
  })

  test('has no association without an Owner author', async () => {
    mocks.authorFindFirst.mockResolvedValue(null)

    const options = await getAuthorOptions()

    expect(options.every((option) => !option.isAssociation)).toBe(true)
    expect(options[1].roleLabel).toBe('Koordinátor')
  })
})
