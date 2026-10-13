import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createArticleTag } from './create-article-tag.server'

const mocks = vi.hoisted(() => ({
  articleTagCreate: vi.fn(),
  publishContentEvent: vi.fn(),
  withAuthorPermission: vi.fn(),
}))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({ withAuthorPermission: mocks.withAuthorPermission }),
)

vi.mock('~/utils/sse/publish-content-event.server', () => ({
  publishContentEvent: mocks.publishContentEvent,
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { articleTag: { create: mocks.articleTagCreate } },
}))

const request = new Request('https://test.local/')

const options = { authorId: 'author-1', name: 'Tag', slug: 'tag' }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.withAuthorPermission.mockImplementation(
    (_request: Request, { execute }: { execute: () => Promise<unknown> }) =>
      execute(),
  )
  mocks.articleTagCreate.mockResolvedValue({ id: 'tag-1' })
})

describe('createArticleTag', () => {
  test('announces the created tag', async () => {
    await expect(createArticleTag(request, options)).resolves.toEqual({
      id: 'tag-1',
    })

    expect(mocks.publishContentEvent).toHaveBeenCalledExactlyOnceWith({
      change: 'create',
      entity: 'article_tag',
      entityId: 'tag-1',
    })
  })

  test('announces nothing when the permission is denied', async () => {
    mocks.withAuthorPermission.mockRejectedValue(data(null, { status: 403 }))

    await expect(createArticleTag(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.articleTagCreate).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })
})
