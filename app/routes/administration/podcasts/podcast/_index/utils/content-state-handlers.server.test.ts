import { beforeEach, describe, expect, test, vi } from 'vitest'

import { podcastContentStateHandlers } from './content-state-handlers.server'

// Pass-through the permission wrapper and mock only the Prisma call we assert on,
// so this exercises the podcast config's applyState review-clearing directly.
const { withAuthorPermissionMock, podcastUpdateMock } = vi.hoisted(() => ({
  podcastUpdateMock: vi.fn(),
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
  prisma: { podcast: { update: podcastUpdateMock } },
}))

const request = new Request('https://test.local/')
const target = { authorIds: ['author-1'], state: 'published' as const }

beforeEach(() => {
  podcastUpdateMock.mockResolvedValue(undefined)
  withAuthorPermissionMock.mockImplementation(
    (
      _request: Request,
      options: { execute: (context: unknown) => Promise<unknown> },
    ) => options.execute({ authorId: 'author-1', roleLevel: 1 }),
  )
})

describe('podcastContentStateHandlers — review clearing on draft transitions', () => {
  test('retract clears all reviews and moves to draft', async () => {
    await podcastContentStateHandlers.retract(request, { id: 'p1', target })

    expect(podcastUpdateMock).toHaveBeenCalledWith({
      data: { publishedAt: null, reviews: { deleteMany: {} }, state: 'draft' },
      where: { id: 'p1' },
    })
  })

  test('restore clears all reviews and moves to draft', async () => {
    await podcastContentStateHandlers.restore(request, { id: 'p1', target })

    expect(podcastUpdateMock).toHaveBeenCalledWith({
      data: { publishedAt: null, reviews: { deleteMany: {} }, state: 'draft' },
      where: { id: 'p1' },
    })
  })

  test('archive keeps reviews intact', async () => {
    await podcastContentStateHandlers.archive(request, { id: 'p1', target })

    expect(podcastUpdateMock).toHaveBeenCalledWith({
      data: { state: 'archived' },
      where: { id: 'p1' },
    })
  })
})
