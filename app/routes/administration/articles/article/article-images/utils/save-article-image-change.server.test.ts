import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { saveArticleImageChange } from './save-article-image-change.server'

const mocks = vi.hoisted(() => ({
  articleFindUnique: vi.fn(),
  articleFindUniqueOrThrow: vi.fn(),
  articleUpdate: vi.fn(),
  articleUpdateMany: vi.fn(),
  permissionContext: vi.fn(),
  recordEditLog: vi.fn(),
  transaction: vi.fn(),
  withAuthorPermission: vi.fn(),
}))

vi.mock('~/utils/content-log/record-edit-log.server', () => ({
  recordEditLog: mocks.recordEditLog,
}))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({ withAuthorPermission: mocks.withAuthorPermission }),
)

vi.mock('~/utils/db.server', () => ({
  prisma: {
    $transaction: mocks.transaction,
    article: {
      findUnique: mocks.articleFindUnique,
      findUniqueOrThrow: mocks.articleFindUniqueOrThrow,
      update: mocks.articleUpdate,
      updateMany: mocks.articleUpdateMany,
    },
  },
}))

const request = new Request('https://test.local/')

const ownHold = {
  heldByAuthor: { name: 'Marie Horáková' },
  heldByAuthorId: 'author-1',
  heldByTabId: 'tab-1',
  heldSince: new Date(Date.now() - 60_000),
  heldUntil: new Date(Date.now() + 60_000),
}

const storedArticle = {
  authors: [{ id: 'author-1' }],
  featuredImageId: 'image-featured',
  firstContentAt: new Date('2026-09-20T10:00:00Z'),
  ...ownHold,
  publishedSlug: 'article',
  state: 'draft',
  submittedAt: null,
}

const savedAt = new Date('2026-10-16T12:00:00Z')
const previousSavedAt = new Date('2026-10-16T11:00:00Z')

type Prepare = Parameters<typeof saveArticleImageChange>[1]['prepare']

// The writes are tags standing in for Prisma operations.
const buildPrepare = (overrides: Record<string, unknown> = {}) =>
  vi.fn<Prepare>(
    async () =>
      ({
        answer: { previewUrl: 'preview' },
        writes: ['image-write'],
        ...overrides,
      }) as never,
  )

const options = { articleId: 'article-1', tabId: 'tab-1' }

const notFoundError = () =>
  new Prisma.PrismaClientKnownRequestError('No record', {
    clientVersion: 'test',
    code: 'P2025',
  })

beforeEach(() => {
  vi.clearAllMocks()
  mocks.permissionContext.mockReturnValue({
    authorId: 'author-1',
    roleLevel: 1,
  })
  mocks.withAuthorPermission.mockImplementation(
    (
      _request: Request,
      { execute }: { execute: (context: unknown) => Promise<unknown> },
    ) => execute(mocks.permissionContext()),
  )
  mocks.articleFindUnique.mockResolvedValue(storedArticle)
  mocks.articleUpdate.mockReturnValue('update-article')
  mocks.articleFindUniqueOrThrow.mockReturnValue('read-previous')
  mocks.articleUpdateMany.mockReturnValue('mark-first-content')
  mocks.transaction.mockImplementation(async (writes: unknown[]) =>
    writes.map((write) =>
      write === 'update-article'
        ? { updatedAt: savedAt }
        : write === 'read-previous'
          ? { updatedAt: previousSavedAt }
          : write === 'mark-first-content'
            ? { count: 0 }
            : {},
    ),
  )
})

describe('saveArticleImageChange — the article and the permission', () => {
  test('answers 404 for a missing article', async () => {
    mocks.articleFindUnique.mockResolvedValue(null)
    const prepare = buildPrepare()

    await expect(
      saveArticleImageChange(request, { ...options, prepare }),
    ).rejects.toMatchObject({ init: { status: 404 } })

    expect(prepare).not.toHaveBeenCalled()
    expect(mocks.withAuthorPermission).not.toHaveBeenCalled()
  })

  test('checks the stored authors and state', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      authors: [{ id: 'author-2' }],
      state: 'published',
    })

    await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(mocks.withAuthorPermission).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        action: 'update',
        entity: 'article',
        target: { authorIds: ['author-2'], state: 'published' },
      }),
    )
  })

  test('answers 403 for a submitted article locked for its author', async () => {
    mocks.permissionContext.mockReturnValue({
      authorId: 'author-1',
      roleLevel: 3,
    })
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      submittedAt: new Date('2026-10-15T08:00:00Z'),
    })
    const prepare = buildPrepare()

    await expect(
      saveArticleImageChange(request, { ...options, prepare }),
    ).rejects.toMatchObject({ init: { status: 403 } })

    expect(prepare).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('lets the Coordinator change a submitted article', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      submittedAt: new Date('2026-10-15T08:00:00Z'),
    })

    const result = await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(result).toMatchObject({ status: 'saved' })
  })
})

describe('saveArticleImageChange — the edit hold', () => {
  test('writes nothing when another author holds the article', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      heldByAuthor: { name: 'Jakub Novák' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-9',
    })
    const prepare = buildPrepare()

    const result = await saveArticleImageChange(request, {
      ...options,
      prepare,
    })

    expect(result).toEqual({ heldByName: 'Jakub Novák', status: 'not-held' })
    expect(prepare).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('writes nothing from another tab of the same author', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      heldByTabId: 'tab-2',
    })
    const prepare = buildPrepare()

    const result = await saveArticleImageChange(request, {
      ...options,
      prepare,
    })

    expect(result).toEqual({ heldByName: 'Marie Horáková', status: 'not-held' })
    expect(prepare).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('names nobody when the hold expired', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-9',
      heldUntil: new Date(Date.now() - 1000),
    })

    const result = await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(result).toEqual({ heldByName: null, status: 'not-held' })
  })

  test('refuses an article nobody holds', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      heldByAuthor: null,
      heldByAuthorId: null,
      heldByTabId: null,
      heldSince: null,
      heldUntil: null,
    })

    const result = await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(result).toEqual({ heldByName: null, status: 'not-held' })
  })

  test('the article write needs the holding tab and a draft', async () => {
    await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(mocks.articleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { updatedAt: true },
        where: {
          heldByAuthorId: 'author-1',
          heldByTabId: 'tab-1',
          id: 'article-1',
          state: 'draft',
        },
      }),
    )
  })

  describe('landsWithoutHold', () => {
    const releasedArticle = {
      ...storedArticle,
      heldByAuthor: null,
      heldByAuthorId: null,
      heldByTabId: null,
      heldSince: null,
      heldUntil: null,
    }

    test('accepts a released hold and widens the write to it', async () => {
      mocks.articleFindUnique.mockResolvedValue(releasedArticle)
      const prepare = buildPrepare()

      const result = await saveArticleImageChange(request, {
        ...options,
        landsWithoutHold: true,
        prepare,
      })

      expect(result).toMatchObject({ status: 'saved' })
      expect(prepare).toHaveBeenCalledOnce()
      expect(mocks.articleUpdate.mock.lastCall?.[0].where).toEqual({
        id: 'article-1',
        OR: [
          { heldByAuthorId: 'author-1', heldByTabId: 'tab-1' },
          { heldByTabId: null },
        ],
        state: 'draft',
      })
    })

    test('still accepts the own tab’s hold', async () => {
      const prepare = buildPrepare()

      const result = await saveArticleImageChange(request, {
        ...options,
        landsWithoutHold: true,
        prepare,
      })

      expect(result).toMatchObject({ status: 'saved' })
    })

    test('for an author, the write also needs a text not submitted meanwhile', async () => {
      mocks.permissionContext.mockReturnValue({
        authorId: 'author-1',
        roleLevel: 3,
      })
      mocks.articleFindUnique.mockResolvedValue(releasedArticle)

      await saveArticleImageChange(request, {
        ...options,
        landsWithoutHold: true,
        prepare: buildPrepare(),
      })

      expect(mocks.articleUpdate.mock.lastCall?.[0].where).toEqual({
        id: 'article-1',
        OR: [
          { heldByAuthorId: 'author-1', heldByTabId: 'tab-1' },
          { heldByTabId: null, submittedAt: null },
        ],
        state: 'draft',
      })
    })

    test('submitted between the check and the write: not-held, not a 500 (07d)', async () => {
      mocks.permissionContext.mockReturnValue({
        authorId: 'author-1',
        roleLevel: 3,
      })
      mocks.transaction.mockRejectedValue(notFoundError())
      mocks.articleFindUnique
        .mockResolvedValueOnce(releasedArticle)
        .mockResolvedValueOnce({
          ...releasedArticle,
          submittedAt: new Date('2026-10-16T12:05:00Z'),
        })
      const onRefused = vi.fn()

      const result = await saveArticleImageChange(request, {
        ...options,
        landsWithoutHold: true,
        prepare: buildPrepare({ onRefused }),
      })

      expect(result).toEqual({ heldByName: null, status: 'not-held' })
      expect(onRefused).toHaveBeenCalledOnce()
    })

    test('refuses a published article before storing anything', async () => {
      mocks.articleFindUnique.mockResolvedValue({
        ...releasedArticle,
        state: 'published',
      })
      const prepare = buildPrepare()

      const result = await saveArticleImageChange(request, {
        ...options,
        landsWithoutHold: true,
        prepare,
      })

      expect(result).toEqual({ heldByName: null, status: 'not-held' })
      expect(prepare).not.toHaveBeenCalled()
    })

    test('still refuses an article held by someone else', async () => {
      mocks.articleFindUnique.mockResolvedValue({
        ...storedArticle,
        heldByAuthor: { name: 'Jakub Novák' },
        heldByAuthorId: 'author-2',
        heldByTabId: 'tab-9',
      })
      const prepare = buildPrepare()

      const result = await saveArticleImageChange(request, {
        ...options,
        landsWithoutHold: true,
        prepare,
      })

      expect(result).toEqual({ heldByName: 'Jakub Novák', status: 'not-held' })
      expect(prepare).not.toHaveBeenCalled()
      expect(mocks.transaction).not.toHaveBeenCalled()
    })
  })
})

describe('saveArticleImageChange — prepare', () => {
  test('hands over the context and the stored article', async () => {
    const prepare = buildPrepare()

    await saveArticleImageChange(request, { ...options, prepare })

    expect(prepare).toHaveBeenCalledWith(
      { authorId: 'author-1', roleLevel: 1 },
      { featuredImageId: 'image-featured', publishedSlug: 'article' },
    )
  })

  test('returns a failed preparation without a transaction', async () => {
    const prepare = vi.fn(async () => ({ status: 'failed' as const }))

    const result = await saveArticleImageChange(request, {
      ...options,
      prepare,
    })

    expect(result).toEqual({ status: 'failed' })
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.recordEditLog).not.toHaveBeenCalled()
  })

  test('lets what prepare throws through', async () => {
    const prepare = vi.fn(async () => {
      throw new Response(null, { status: 400 })
    })

    await expect(
      saveArticleImageChange(request, { ...options, prepare }),
    ).rejects.toBeInstanceOf(Response)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
})

describe('saveArticleImageChange — the transaction', () => {
  test('commits the writes and the article write, answering updatedAt', async () => {
    const onCommitted = vi.fn(async () => undefined)
    const onRefused = vi.fn(async () => undefined)

    const result = await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare({
        articleData: { featuredImageId: 'image-1' },
        onCommitted,
        onRefused,
        writes: ['write-1', 'write-2'],
      }),
    })

    expect(mocks.transaction).toHaveBeenCalledWith([
      'write-1',
      'write-2',
      'update-article',
    ])
    expect(mocks.articleUpdate.mock.lastCall?.[0].data).toEqual({
      featuredImageId: 'image-1',
      updatedAt: expect.any(Date),
    })
    expect(result).toEqual({
      previewUrl: 'preview',
      status: 'saved',
      updatedAt: savedAt,
    })
    expect(onCommitted).toHaveBeenCalledOnce()
    expect(onRefused).not.toHaveBeenCalled()
  })

  test('runs onCommitted after the transaction', async () => {
    const order: string[] = []
    mocks.transaction.mockImplementation(async () => {
      order.push('transaction')
      return [{ updatedAt: savedAt }]
    })

    await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare({
        onCommitted: async () => {
          order.push('committed')
        },
      }),
    })

    expect(order).toEqual(['transaction', 'committed'])
  })

  test('a failed cleanup after the commit still answers saved and logs', async () => {
    const onCommitted = vi.fn().mockRejectedValue(new Error('store down'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare({ onCommitted }),
    })

    expect(result).toMatchObject({ status: 'saved' })
    expect(mocks.recordEditLog).toHaveBeenCalledOnce()
    consoleError.mockRestore()
  })

  test('marks the first content first when the change adds content', async () => {
    await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare({ addsContent: true }),
    })

    expect(mocks.articleUpdateMany).toHaveBeenCalledWith({
      data: { firstContentAt: expect.any(Date) },
      where: { firstContentAt: null, id: 'article-1' },
    })
    expect(mocks.transaction).toHaveBeenCalledWith([
      'mark-first-content',
      'image-write',
      'update-article',
    ])
  })

  test('does not mark the first content for a change that adds none', async () => {
    await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(mocks.articleUpdateMany).not.toHaveBeenCalled()
  })
})

describe('saveArticleImageChange — the history', () => {
  test('logs the creation when this change made the first content', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      firstContentAt: null,
    })
    mocks.transaction.mockImplementation(async (writes: unknown[]) =>
      writes.map((write) =>
        write === 'mark-first-content' ? { count: 1 } : { updatedAt: savedAt },
      ),
    )

    await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare({ addsContent: true }),
    })

    expect(mocks.recordEditLog).toHaveBeenCalledWith(
      { authorId: 'author-1', roleLevel: 1 },
      {
        entity: 'article',
        entityId: 'article-1',
        heldSince: ownHold.heldSince,
        isCreation: true,
      },
    )
  })

  test('logs nothing when another save made the first content meanwhile', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      firstContentAt: null,
    })

    await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare({ addsContent: true }),
    })

    // The stored article was still empty, so it is no edit; and the mark
    // matched no row, so it is no creation.
    expect(mocks.recordEditLog).not.toHaveBeenCalled()
  })

  test('logs an edit of an article that already has content', async () => {
    await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(mocks.recordEditLog).toHaveBeenCalledWith(
      { authorId: 'author-1', roleLevel: 1 },
      {
        entity: 'article',
        entityId: 'article-1',
        heldSince: ownHold.heldSince,
        isCreation: false,
      },
    )
  })

  test('logs nothing for an empty draft the change does not fill', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      firstContentAt: null,
    })

    await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(mocks.recordEditLog).not.toHaveBeenCalled()
  })
})

describe('saveArticleImageChange — a refused write', () => {
  test('calls onRefused and answers not-held when the hold moved', async () => {
    const onRefused = vi.fn(async () => undefined)
    const onCommitted = vi.fn(async () => undefined)
    mocks.transaction.mockRejectedValue(notFoundError())
    mocks.articleFindUnique
      .mockResolvedValueOnce(storedArticle)
      .mockResolvedValueOnce({
        ...ownHold,
        heldByAuthor: { name: 'Jakub Novák' },
        heldByAuthorId: 'author-2',
        heldByTabId: 'tab-9',
      })

    const result = await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare({ onCommitted, onRefused }),
    })

    expect(result).toEqual({ heldByName: 'Jakub Novák', status: 'not-held' })
    expect(onRefused).toHaveBeenCalledOnce()
    expect(onCommitted).not.toHaveBeenCalled()
    expect(mocks.recordEditLog).not.toHaveBeenCalled()
    expect(mocks.articleFindUnique).toHaveBeenLastCalledWith({
      select: expect.objectContaining({ heldByTabId: true }),
      where: { id: 'article-1' },
    })
  })

  test('answers not-held with no name when the article was released', async () => {
    mocks.transaction.mockRejectedValue(notFoundError())
    mocks.articleFindUnique
      .mockResolvedValueOnce(storedArticle)
      .mockResolvedValueOnce({
        heldByAuthor: null,
        heldByAuthorId: null,
        heldByTabId: null,
        heldSince: null,
        heldUntil: null,
      })

    const result = await saveArticleImageChange(request, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(result).toEqual({ heldByName: null, status: 'not-held' })
  })

  test('rethrows when the hold is still the tab’s own', async () => {
    const error = notFoundError()
    const onRefused = vi.fn(async () => undefined)
    mocks.transaction.mockRejectedValue(error)
    mocks.articleFindUnique
      .mockResolvedValueOnce(storedArticle)
      .mockResolvedValueOnce(ownHold)

    await expect(
      saveArticleImageChange(request, {
        ...options,
        prepare: buildPrepare({ onRefused }),
      }),
    ).rejects.toBe(error)

    expect(onRefused).toHaveBeenCalledOnce()
  })

  test('answers not-held when the article vanished', async () => {
    const error = notFoundError()
    mocks.transaction.mockRejectedValue(error)
    mocks.articleFindUnique
      .mockResolvedValueOnce(storedArticle)
      .mockResolvedValueOnce(null)

    // A missing article is not the tab's own hold, so it counts as moved.
    await expect(
      saveArticleImageChange(request, {
        ...options,
        prepare: buildPrepare(),
      }),
    ).resolves.toEqual({ heldByName: null, status: 'not-held' })
  })

  test('rethrows any other error after onRefused, without re-reading the hold', async () => {
    const error = new Error('disk full')
    const onRefused = vi.fn(async () => undefined)
    mocks.transaction.mockRejectedValue(error)

    await expect(
      saveArticleImageChange(request, {
        ...options,
        prepare: buildPrepare({ onRefused }),
      }),
    ).rejects.toBe(error)

    expect(onRefused).toHaveBeenCalledOnce()
    expect(mocks.articleFindUnique).toHaveBeenCalledOnce()
  })

  test('with landsWithoutHold, a released hold is still allowed on a refusal', async () => {
    const error = notFoundError()
    mocks.transaction.mockRejectedValue(error)
    mocks.articleFindUnique
      .mockResolvedValueOnce({
        ...storedArticle,
        heldByAuthor: null,
        heldByAuthorId: null,
        heldByTabId: null,
        heldSince: null,
        heldUntil: null,
      })
      .mockResolvedValueOnce({
        heldByAuthor: null,
        heldByAuthorId: null,
        heldByTabId: null,
        heldSince: null,
        heldUntil: null,
        state: 'draft',
        submittedAt: null,
      })

    await expect(
      saveArticleImageChange(request, {
        ...options,
        landsWithoutHold: true,
        prepare: buildPrepare(),
      }),
    ).rejects.toBe(error)
  })
})

describe('saveArticleImageChange — a cancellable change (bxy8xxqs)', () => {
  const buildCancellable = () => {
    const controller = new AbortController()
    const cancellableRequest = new Request('https://test.local/', {
      signal: controller.signal,
    })
    return { cancel: () => controller.abort(), cancellableRequest }
  }

  test('a cancel before the files are stored runs nothing', async () => {
    const { cancel, cancellableRequest } = buildCancellable()
    cancel()
    const prepare = buildPrepare()

    const result = await saveArticleImageChange(cancellableRequest, {
      ...options,
      isCancellable: true,
      prepare,
    })

    expect(result).toEqual({ status: 'cancelled' })
    expect(prepare).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('a cancel while the files are stored drops them and commits nothing', async () => {
    const { cancel, cancellableRequest } = buildCancellable()
    const onRefused = vi.fn(async () => undefined)
    const prepare = vi.fn<Prepare>(async () => {
      cancel()
      return { answer: {}, onRefused, writes: ['image-write'] } as never
    })

    const result = await saveArticleImageChange(cancellableRequest, {
      ...options,
      isCancellable: true,
      prepare,
    })

    expect(result).toEqual({ status: 'cancelled' })
    expect(onRefused).toHaveBeenCalledOnce()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('a cancel during the commit puts things back, not onCommitted', async () => {
    const { cancel, cancellableRequest } = buildCancellable()
    mocks.transaction.mockImplementation(async () => {
      cancel()
      return [{ updatedAt: savedAt }]
    })
    const onCancelled = vi.fn(async () => undefined)
    const onCommitted = vi.fn(async () => undefined)

    const result = await saveArticleImageChange(cancellableRequest, {
      ...options,
      isCancellable: true,
      prepare: buildPrepare({ onCancelled, onCommitted }),
    })

    expect(result).toEqual({ status: 'cancelled' })
    expect(onCancelled).toHaveBeenCalledOnce()
    expect(onCommitted).not.toHaveBeenCalled()
    expect(mocks.recordEditLog).not.toHaveBeenCalled()
  })

  test('the empty draft a cancelled first image filled stays empty', async () => {
    const { cancel, cancellableRequest } = buildCancellable()
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      firstContentAt: null,
    })
    mocks.transaction.mockImplementation(async (writes: unknown[]) => {
      cancel()
      return writes.map((write) =>
        write === 'mark-first-content'
          ? { count: 1 }
          : write === 'read-previous'
            ? { updatedAt: previousSavedAt }
            : { updatedAt: savedAt },
      )
    })

    await saveArticleImageChange(cancellableRequest, {
      ...options,
      isCancellable: true,
      prepare: buildPrepare({
        addsContent: true,
        onCancelled: async () => undefined,
      }),
    })

    expect(mocks.transaction).toHaveBeenCalledWith([
      'read-previous',
      'mark-first-content',
      'image-write',
      'update-article',
    ])
    expect(mocks.articleUpdateMany).toHaveBeenLastCalledWith({
      data: { firstContentAt: null, updatedAt: previousSavedAt },
      where: { id: 'article-1', updatedAt: savedAt },
    })
  })

  test('a cancel during the commit puts the updatedAt back, unless something saved since', async () => {
    const { cancel, cancellableRequest } = buildCancellable()
    mocks.transaction.mockImplementation(async (writes: unknown[]) => {
      cancel()
      return writes.map((write) =>
        write === 'read-previous'
          ? { updatedAt: previousSavedAt }
          : { updatedAt: savedAt },
      )
    })

    await saveArticleImageChange(cancellableRequest, {
      ...options,
      isCancellable: true,
      prepare: buildPrepare({ onCancelled: async () => undefined }),
    })

    // Conditional on the commit's own updatedAt: a later save keeps its own.
    expect(mocks.articleUpdateMany).toHaveBeenLastCalledWith({
      data: { updatedAt: previousSavedAt },
      where: { id: 'article-1', updatedAt: savedAt },
    })
  })

  test('a change that is not cancellable saves despite an aborted request', async () => {
    const { cancel, cancellableRequest } = buildCancellable()
    cancel()

    const result = await saveArticleImageChange(cancellableRequest, {
      ...options,
      prepare: buildPrepare(),
    })

    expect(result).toMatchObject({ status: 'saved' })
  })
})
