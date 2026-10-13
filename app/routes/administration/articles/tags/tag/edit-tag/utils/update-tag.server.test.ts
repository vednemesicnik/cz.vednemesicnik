import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { updateTag } from './update-tag.server'

const mocks = vi.hoisted(() => ({
  articleTagUpdate: vi.fn(),
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
  prisma: { articleTag: { update: mocks.articleTagUpdate } },
}))

const request = new Request('https://test.local/')

const options = {
  authorId: 'author-1',
  name: 'Tag',
  slug: 'tag',
  state: 'draft' as const,
  tagId: 'tag-1',
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.withAuthorPermission.mockImplementation(
    (_request: Request, { execute }: { execute: () => Promise<unknown> }) =>
      execute(),
  )
  mocks.articleTagUpdate.mockResolvedValue({ id: 'tag-1' })
})

describe('updateTag', () => {
  test('checks the tag permission', async () => {
    await updateTag(request, options)

    expect(mocks.withAuthorPermission).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        action: 'update',
        entity: 'article_tag',
        target: { authorIds: ['author-1'], state: 'draft' },
      }),
    )
  })
  test('announces the updated tag', async () => {
    await expect(updateTag(request, options)).resolves.toEqual({
      id: 'tag-1',
    })

    expect(mocks.publishContentEvent).toHaveBeenCalledExactlyOnceWith({
      change: 'update',
      entity: 'article_tag',
      entityId: 'tag-1',
    })
  })

  test('announces nothing when the write fails', async () => {
    mocks.articleTagUpdate.mockRejectedValue(new Error('unique constraint'))

    await expect(updateTag(request, options)).rejects.toThrow(
      'unique constraint',
    )
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('announces nothing when the permission is denied', async () => {
    mocks.withAuthorPermission.mockRejectedValue(data(null, { status: 403 }))

    await expect(updateTag(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.articleTagUpdate).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })
})
