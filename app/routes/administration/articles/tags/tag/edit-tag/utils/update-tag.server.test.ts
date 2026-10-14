import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { updateTag } from './update-tag.server'

const mocks = vi.hoisted(() => ({
  articleTagFindUnique: vi.fn(),
  articleTagUpdate: vi.fn(),
  checkAuthorPermission: vi.fn(),
  publishContentEvent: vi.fn(),
  withAuthorPermission: vi.fn(),
}))

// The content log has its own tests; here it only must not reach Prisma.
vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: vi.fn(),
}))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({ withAuthorPermission: mocks.withAuthorPermission }),
)

vi.mock(
  '~/utils/permissions/author/guards/check-author-permission.server',
  () => ({ checkAuthorPermission: mocks.checkAuthorPermission }),
)

vi.mock('~/utils/sse/publish-content-event.server', () => ({
  publishContentEvent: mocks.publishContentEvent,
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    articleTag: {
      findUnique: mocks.articleTagFindUnique,
      update: mocks.articleTagUpdate,
    },
  },
}))

const request = new Request('https://test.local/')
const context = {
  authorId: 'author-1',
  authorName: 'Marie Horáková',
  roleLevel: 3,
}

const options = {
  authorId: 'author-1',
  name: 'Tag',
  slug: 'tag',
  tagId: 'tag-1',
}

const storedTag = { authorId: 'author-1', state: 'draft', submittedAt: null }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.withAuthorPermission.mockImplementation(
    (
      _request: Request,
      { execute }: { execute: (context: unknown) => Promise<unknown> },
    ) => execute(context),
  )
  // clearAllMocks keeps implementations; a test's denial must not leak.
  mocks.checkAuthorPermission.mockReset()
  mocks.articleTagUpdate.mockResolvedValue({ id: 'tag-1' })
  mocks.articleTagFindUnique.mockResolvedValue(storedTag)
})

describe('updateTag', () => {
  test('checks the stored author and state, not the ones the form sends', async () => {
    mocks.articleTagFindUnique.mockResolvedValue({
      ...storedTag,
      authorId: 'author-2',
      state: 'published',
    })

    await updateTag(request, options)

    expect(mocks.withAuthorPermission).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        action: 'update',
        entity: 'article_tag',
        target: { authorIds: ['author-2'], state: 'published' },
      }),
    )
  })

  test('checks the author it sets against the stored state', async () => {
    await updateTag(request, { ...options, authorId: 'author-3' })

    expect(mocks.checkAuthorPermission).toHaveBeenCalledWith(context, {
      action: 'update',
      entity: 'article_tag',
      state: 'draft',
      targetAuthorIds: ['author-3'],
    })
  })

  test('writes nothing when the new author is not allowed', async () => {
    mocks.checkAuthorPermission.mockImplementation(() => {
      throw data(null, { status: 403 })
    })

    await expect(updateTag(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.articleTagUpdate).not.toHaveBeenCalled()
  })

  test('answers a missing tag with 404', async () => {
    mocks.articleTagFindUnique.mockResolvedValue(null)

    await expect(updateTag(request, options)).rejects.toMatchObject({
      init: { status: 404 },
    })
    expect(mocks.withAuthorPermission).not.toHaveBeenCalled()
  })
  test('announces the updated tag', async () => {
    await expect(updateTag(request, options)).resolves.toEqual({
      id: 'tag-1',
    })

    expect(mocks.publishContentEvent).toHaveBeenCalledExactlyOnceWith(
      {
        change: 'update',
        entity: 'article_tag',
        entityId: 'tag-1',
      },
      context,
    )
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

  test('refuses its author while the tag is submitted', async () => {
    mocks.articleTagFindUnique.mockResolvedValue({
      ...storedTag,
      submittedAt: new Date('2026-10-13T10:00:00Z'),
    })

    await expect(updateTag(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.articleTagUpdate).not.toHaveBeenCalled()
  })
})
