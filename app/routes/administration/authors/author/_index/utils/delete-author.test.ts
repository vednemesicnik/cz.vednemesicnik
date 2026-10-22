import { beforeEach, describe, expect, test, vi } from 'vitest'

const { authorDelete, authorFindUniqueOrThrow } = vi.hoisted(() => ({
  authorDelete: vi.fn(),
  authorFindUniqueOrThrow: vi.fn(),
}))

vi.mock('~/utils/db.server', () => {
  const transaction = {
    author: {
      delete: authorDelete,
      findUniqueOrThrow: authorFindUniqueOrThrow,
    },
  }

  return {
    prisma: {
      $transaction: (run: (client: typeof transaction) => unknown) =>
        run(transaction),
    },
  }
})
vi.mock('~/utils/permissions/user/actions/with-user-permission.server', () => ({
  withUserPermission: (
    _request: Request,
    options: { execute: (context: unknown) => unknown },
  ) => options.execute({ userId: 'admin' }),
}))

import { deleteAuthor } from './delete-author'

const NO_REFERENCES = {
  articleCategories: 0,
  articles: 0,
  articleTags: 0,
  issues: 0,
  podcastEpisodes: 0,
  podcasts: 0,
  reviews: 0,
}

const storedAuthor = (
  counts: Partial<typeof NO_REFERENCES> = {},
  user: { id: string } | null = null,
) => ({ _count: { ...NO_REFERENCES, ...counts }, user })

const remove = () =>
  deleteAuthor(new Request('https://test.local/administration/authors/a1'), {
    id: 'a1',
    target: { userId: undefined },
  })

describe('deleteAuthor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('deletes an author nothing holds', async () => {
    authorFindUniqueOrThrow.mockResolvedValue(storedAuthor())

    await expect(remove()).resolves.toEqual({ status: 'deleted' })
    expect(authorDelete).toHaveBeenCalledWith({ where: { id: 'a1' } })
  })

  test.each([
    ['only on articles', storedAuthor({ articles: 1 })],
    ['referenced by a category', storedAuthor({ articleCategories: 1 })],
    ['referenced only by an approval', storedAuthor({ reviews: 1 })],
    ['with an account', storedAuthor({}, { id: 'user-1' })],
  ])('refuses an author %s, and leaves it in place', async (_case, author) => {
    authorFindUniqueOrThrow.mockResolvedValue(author)

    await expect(remove()).resolves.toMatchObject({
      deleteBlock: { deletable: false },
      status: 'blocked',
    })
    expect(authorDelete).not.toHaveBeenCalled()
  })
})
