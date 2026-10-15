import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createDraftArticle } from './create-draft-article.server'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  deleteStaleEmptyDrafts: vi.fn(),
  getAuthorPermissionContext: vi.fn(),
  requireAuthorPermission: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { article: { create: mocks.create } },
}))

vi.mock(
  '~/utils/permissions/author/context/get-author-permission-context.server',
  () => ({ getAuthorPermissionContext: mocks.getAuthorPermissionContext }),
)

vi.mock(
  '~/utils/permissions/author/guards/require-author-permission.server',
  () => ({
    requireAuthorPermission: mocks.requireAuthorPermission,
  }),
)

vi.mock('./delete-stale-empty-drafts.server', () => ({
  deleteStaleEmptyDrafts: mocks.deleteStaleEmptyDrafts,
}))

const request = new Request('https://test.local/')
const context = { authorId: 'author-1' }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireAuthorPermission.mockReset()
  mocks.getAuthorPermissionContext.mockResolvedValue(context)
  mocks.create.mockResolvedValue({ id: 'draft-1' })
})

describe('createDraftArticle', () => {
  test('creates an empty draft of the signed-in author', async () => {
    expect(await createDraftArticle(request)).toEqual({ articleId: 'draft-1' })

    expect(mocks.requireAuthorPermission).toHaveBeenCalledWith(context, {
      action: 'create',
      entity: 'article',
      state: 'draft',
      targetAuthorIds: ['author-1'],
    })
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        authors: { connect: { id: 'author-1' } },
        content: '',
        title: '',
      },
      select: { id: true },
    })
  })

  test('clears the empty drafts left over from earlier clicks', async () => {
    await createDraftArticle(request)

    expect(mocks.deleteStaleEmptyDrafts).toHaveBeenCalledOnce()
  })

  test('creates nothing for an author who may not create articles', async () => {
    mocks.requireAuthorPermission.mockImplementation(() => {
      throw data(null, { status: 403 })
    })

    await expect(createDraftArticle(request)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
