import { beforeEach, describe, expect, test, vi } from 'vitest'

import { updateTag } from './update-tag.server'

const mocks = vi.hoisted(() => ({
  articleTagFindMany: vi.fn(),
  articleTagFindUnique: vi.fn(),
  articleTagUpdateMany: vi.fn(),
  getAuthorPermissionContext: vi.fn(),
  publishContentEvent: vi.fn(),
}))

// The content log has its own tests; here it only must not reach Prisma.
vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: vi.fn(),
}))

vi.mock(
  '~/utils/permissions/author/context/get-author-permission-context.server',
  () => ({ getAuthorPermissionContext: mocks.getAuthorPermissionContext }),
)

vi.mock('~/utils/sse/publish-content-event.server', () => ({
  publishContentEvent: mocks.publishContentEvent,
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    articleTag: {
      findMany: mocks.articleTagFindMany,
      findUnique: mocks.articleTagFindUnique,
      updateMany: mocks.articleTagUpdateMany,
    },
  },
}))

const COORDINATOR_LEVEL = 1
const CREATOR_LEVEL = 2

const request = new Request('https://test.local/')

type Config = {
  action: string
  targetAuthorIds?: string[]
}

const createContext = (
  roleLevel: number,
  can: (config: Config) => boolean = () => true,
) => ({
  authorId: 'author-1',
  authorName: 'Marie Horáková',
  can: vi.fn((config: Config) => {
    const hasPermission = can(config)
    return { hasAny: hasPermission, hasOwn: hasPermission, hasPermission }
  }),
  roleLevel,
})

const options = {
  name: 'Kultura',
  requestedAuthorId: undefined,
  slug: 'kultura',
  tagId: 'tag-1',
}

const storedTag = {
  authorId: 'author-1',
  name: 'Kultura',
  state: 'draft',
  submittedAt: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getAuthorPermissionContext.mockResolvedValue(
    createContext(CREATOR_LEVEL),
  )
  mocks.articleTagFindUnique.mockResolvedValue(storedTag)
  mocks.articleTagFindMany.mockResolvedValue([])
  mocks.articleTagUpdateMany.mockResolvedValue({ count: 1 })
})

describe('updateTag', () => {
  test("refuses someone else's tag whatever author the form sends", async () => {
    mocks.articleTagFindUnique.mockResolvedValue({
      ...storedTag,
      authorId: 'author-2',
    })
    // A Creator sees others' drafts but edits only their own.
    mocks.getAuthorPermissionContext.mockResolvedValue(
      createContext(
        CREATOR_LEVEL,
        ({ action, targetAuthorIds }) =>
          action === 'view' || targetAuthorIds?.[0] === 'author-1',
      ),
    )

    await expect(
      updateTag(request, { ...options, requestedAuthorId: 'author-1' }),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(mocks.articleTagUpdateMany).not.toHaveBeenCalled()
  })

  test('answers 404 for a tag the person may not view', async () => {
    mocks.getAuthorPermissionContext.mockResolvedValue(
      createContext(CREATOR_LEVEL, ({ action }) => action !== 'view'),
    )

    await expect(updateTag(request, options)).rejects.toMatchObject({
      init: { status: 404 },
    })
  })

  test('answers 404 for a missing tag', async () => {
    mocks.articleTagFindUnique.mockResolvedValue(null)

    await expect(updateTag(request, options)).rejects.toMatchObject({
      init: { status: 404 },
    })
  })

  test('keeps the stored author whatever author a Creator sends', async () => {
    await updateTag(request, { ...options, requestedAuthorId: 'author-2' })

    expect(mocks.articleTagUpdateMany.mock.lastCall?.[0].data).toEqual({
      authorId: 'author-1',
      name: 'Kultura',
      slug: 'kultura',
    })
  })

  test('refuses an author the Coordinator may not hand the tag to', async () => {
    mocks.getAuthorPermissionContext.mockResolvedValue(
      createContext(
        COORDINATOR_LEVEL,
        ({ targetAuthorIds }) => targetAuthorIds?.[0] === 'author-1',
      ),
    )

    await expect(
      updateTag(request, { ...options, requestedAuthorId: 'author-2' }),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(mocks.articleTagUpdateMany).not.toHaveBeenCalled()
  })

  test('refuses a draft its author submitted', async () => {
    mocks.articleTagFindUnique.mockResolvedValue({
      ...storedTag,
      submittedAt: new Date('2026-10-14T10:00:00Z'),
    })

    await expect(updateTag(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
  })

  test('writes only while the author, state and submission are the ones checked', async () => {
    mocks.articleTagUpdateMany.mockResolvedValue({ count: 0 })

    await expect(updateTag(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.articleTagUpdateMany.mock.lastCall?.[0].where).toEqual({
      authorId: 'author-1',
      id: 'tag-1',
      state: 'draft',
      submittedAt: null,
    })
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('answers a taken name and address, leaving its own record out', async () => {
    mocks.articleTagFindMany.mockResolvedValue([
      { name: 'KULTURA', slug: 'kultura' },
    ])

    await expect(updateTag(request, options)).resolves.toEqual({
      isNameTaken: true,
      slugSuggestion: 'kultura-2',
      status: 'conflict',
    })
    expect(mocks.articleTagFindMany.mock.lastCall?.[0].where).toEqual({
      id: { not: 'tag-1' },
    })
    expect(mocks.articleTagUpdateMany).not.toHaveBeenCalled()
  })

  test('announces the saved tag', async () => {
    await expect(updateTag(request, options)).resolves.toEqual({
      id: 'tag-1',
      status: 'success',
    })

    expect(mocks.publishContentEvent).toHaveBeenCalledExactlyOnceWith(
      {
        change: 'update',
        entity: 'article_tag',
        entityId: 'tag-1',
      },
      expect.objectContaining({ authorId: 'author-1' }),
    )
  })
})
