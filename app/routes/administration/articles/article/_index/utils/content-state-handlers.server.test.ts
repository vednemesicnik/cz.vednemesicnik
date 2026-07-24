import { beforeEach, describe, expect, test, vi } from 'vitest'

import { articleContentStateHandlers } from './content-state-handlers.server'

// Pass-through the permission wrapper and mock the two Prisma writes so this
// exercises the article config's applyState: the entity row clears reviews on a
// draft transition, but the mirrored PageSEO row must not (updateMany rejects
// nested relation writes).
const { withAuthorPermissionMock, articleUpdateMock, pageSeoUpdateManyMock } =
  vi.hoisted(() => ({
    articleUpdateMock: vi.fn(),
    pageSeoUpdateManyMock: vi.fn(),
    withAuthorPermissionMock: vi.fn(),
  }))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({
    withAuthorPermission: (
      request: Request,
      options: { execute: (context: unknown) => Promise<unknown> },
    ) => withAuthorPermissionMock(request, options),
  }),
)

vi.mock('~/utils/db.server', () => ({
  prisma: {
    article: { update: articleUpdateMock },
    pageSEO: { updateMany: pageSeoUpdateManyMock },
  },
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteRowWithImages: vi.fn(),
}))

const request = new Request('https://test.local/')
const target = { authorIds: ['author-1'], state: 'published' as const }

beforeEach(() => {
  articleUpdateMock.mockResolvedValue({ slug: 'clear-redirect-test' })
  pageSeoUpdateManyMock.mockResolvedValue(undefined)
  withAuthorPermissionMock.mockImplementation(
    (
      _request: Request,
      options: { execute: (context: unknown) => Promise<unknown> },
    ) => options.execute({ authorId: 'author-1', roleLevel: 1 }),
  )
})

describe('articleContentStateHandlers — retract review clearing', () => {
  test('clears reviews on the article row but not on the PageSEO row', async () => {
    await articleContentStateHandlers.retract(request, { id: 'a1', target })

    expect(articleUpdateMock).toHaveBeenCalledWith({
      data: { publishedAt: null, reviews: { deleteMany: {} }, state: 'draft' },
      select: { slug: true },
      where: { id: 'a1' },
    })

    const pageSeoData = pageSeoUpdateManyMock.mock.calls[0][0].data
    expect(pageSeoData).toEqual({ publishedAt: null, state: 'draft' })
    expect(pageSeoData).not.toHaveProperty('reviews')
  })
})
