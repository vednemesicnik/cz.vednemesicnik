import { Prisma } from '@generated/prisma/client'
import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { updateArticle } from './update-article.server'

// Pass-through permission wrapper and mocked Prisma. The queued Prisma
// operations return tags so the test can see what went into the transaction.
const mocks = vi.hoisted(() => ({
  articleCategoryFindMany: vi.fn(),
  articleFindMany: vi.fn(),
  articleFindUnique: vi.fn(),
  articleImageCount: vi.fn(),
  articleImageUpdateMany: vi.fn(),
  articleTagFindMany: vi.fn(),
  articleUpdate: vi.fn(),
  articleUpdateMany: vi.fn(),
  authorCount: vi.fn(),
  checkAuthorPermission: vi.fn(),
  contentLogCount: vi.fn(),
  pageSeoDeleteMany: vi.fn(),
  pageSeoUpsert: vi.fn(),
  permissionContext: vi.fn(),
  publishContentEvent: vi.fn(),
  recordContentLog: vi.fn(),
  transaction: vi.fn(),
  withAuthorPermission: vi.fn(),
}))

// The content log has its own tests; here it only must not reach Prisma.
vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: mocks.recordContentLog,
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
    $transaction: mocks.transaction,
    article: {
      findMany: mocks.articleFindMany,
      findUnique: mocks.articleFindUnique,
      update: mocks.articleUpdate,
      updateMany: mocks.articleUpdateMany,
    },
    articleCategory: { findMany: mocks.articleCategoryFindMany },
    articleImage: {
      count: mocks.articleImageCount,
      updateMany: mocks.articleImageUpdateMany,
    },
    articleTag: { findMany: mocks.articleTagFindMany },
    author: { count: mocks.authorCount },
    contentLog: { count: mocks.contentLogCount },
    pageSEO: {
      deleteMany: mocks.pageSeoDeleteMany,
      upsert: mocks.pageSeoUpsert,
    },
  },
}))

vi.mock(
  '~/routes/administration/articles/utils/resolve-article-featured-image-seo.server',
  () => ({
    resolveArticleFeaturedImageSeo: async () => ({
      ogImageUrl: null,
      twitterImageUrl: null,
    }),
  }),
)

const request = new Request('https://test.local/')

const options = {
  articleId: 'article-1',
  authorIds: ['author-1'],
  content: '<p>Text</p>',
  images: [{ altText: 'Kept', description: '', id: 'image-kept' }],
  slug: 'article',
  tabId: 'tab-1',
  title: 'Article',
} satisfies Parameters<typeof updateArticle>[1]

// The saving tab holds the article (decision 0019).
const heldSince = new Date(Date.now() - 60_000)
const ownHold = {
  heldByAuthor: { name: 'Marie Horáková' },
  heldByAuthorId: 'author-1',
  heldByTabId: 'tab-1',
  heldSince,
  heldUntil: new Date(Date.now() + 60_000),
}

const savedAt = new Date('2026-10-15T12:06:00Z')

const storedArticle = {
  authors: [{ id: 'author-1' }],
  categories: [] as Array<{ id: string }>,
  firstContentAt: new Date('2026-09-20T10:00:00Z'),
  ...ownHold,
  slug: 'article',
  state: 'draft',
  submittedAt: null,
  tags: [] as Array<{ id: string }>,
}

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
  // clearAllMocks keeps implementations; a test's denial must not leak.
  mocks.checkAuthorPermission.mockReset()
  // No author the form adds is the association.
  mocks.authorCount.mockResolvedValue(0)
  mocks.articleFindUnique.mockResolvedValue(storedArticle)
  mocks.articleImageUpdateMany.mockReturnValue('update-image-text')
  mocks.articleUpdate.mockReturnValue('update-article')
  // No other article has the address.
  mocks.articleFindMany.mockResolvedValue([])
  // Every category and tag the form sends exists.
  const echoIds = async ({ where }: { where: { id: { in: string[] } } }) =>
    where.id.in.map((id) => ({ id }))
  mocks.articleCategoryFindMany.mockImplementation(echoIds)
  mocks.articleTagFindMany.mockImplementation(echoIds)
  // The article has a stored image.
  mocks.articleImageCount.mockResolvedValue(1)
  mocks.articleUpdateMany.mockReturnValue('mark-first-content')
  mocks.pageSeoDeleteMany.mockReturnValue('delete-orphan-page-seo')
  mocks.pageSeoUpsert.mockReturnValue('upsert-page-seo')
  // The first entry is the first-content mark; 0 rows: not the first save.
  // The article write answers with its new updatedAt.
  mocks.transaction.mockImplementation(async (writes: unknown[]) =>
    writes.map((write) =>
      write === 'update-article' ? { updatedAt: savedAt } : { count: 0 },
    ),
  )
  // Nothing logged in this hold yet.
  mocks.contentLogCount.mockResolvedValue(0)
})

describe('updateArticle — the permission follows the stored article', () => {
  test('checks the stored authors and state, not the ones the form sends', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      authors: [{ id: 'author-2' }],
      state: 'published',
    })

    await updateArticle(request, options)

    expect(mocks.withAuthorPermission).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        action: 'update',
        entity: 'article',
        target: { authorIds: ['author-2'], state: 'published' },
      }),
    )
  })

  test('checks the authors it sets against the stored state', async () => {
    await updateArticle(request, { ...options, authorIds: ['author-3'] })

    expect(mocks.checkAuthorPermission).toHaveBeenCalledWith(
      mocks.permissionContext(),
      {
        action: 'update',
        entity: 'article',
        state: 'draft',
        targetAuthorIds: ['author-3'],
      },
    )
  })

  test('writes nothing when the new authors are not allowed', async () => {
    mocks.checkAuthorPermission.mockImplementation(() => {
      throw data(null, { status: 403 })
    })

    await expect(updateArticle(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('refuses the association added by anyone but the Coordinator', async () => {
    mocks.permissionContext.mockReturnValue({
      authorId: 'author-1',
      roleLevel: 2,
    })
    mocks.authorCount.mockResolvedValue(1)

    await expect(
      updateArticle(request, {
        ...options,
        authorIds: ['author-1', 'association'],
      }),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(mocks.authorCount).toHaveBeenCalledWith({
      where: {
        id: { in: ['association'] },
        user: { role: { name: 'owner' } },
      },
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('keeps the association already stored on a Creator’s save', async () => {
    mocks.permissionContext.mockReturnValue({
      authorId: 'author-1',
      roleLevel: 2,
    })
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      authors: [{ id: 'author-1' }, { id: 'association' }],
    })

    const result = await updateArticle(request, {
      ...options,
      authorIds: ['author-1', 'association'],
    })

    expect(result.status).toBe('saved')
    expect(mocks.authorCount).not.toHaveBeenCalled()
  })

  test('checks only the added authors when the association is stored', async () => {
    mocks.permissionContext.mockReturnValue({
      authorId: 'author-1',
      roleLevel: 2,
    })
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      authors: [{ id: 'author-1' }, { id: 'association' }],
    })

    const result = await updateArticle(request, {
      ...options,
      authorIds: ['author-1', 'association', 'author-2'],
    })

    expect(result.status).toBe('saved')
    expect(mocks.authorCount).toHaveBeenCalledWith({
      where: {
        id: { in: ['author-2'] },
        user: { role: { name: 'owner' } },
      },
    })
  })

  test('lets the Coordinator add the association', async () => {
    mocks.authorCount.mockResolvedValue(1)

    const result = await updateArticle(request, {
      ...options,
      authorIds: ['association'],
    })

    expect(result.status).toBe('saved')
    expect(mocks.authorCount).not.toHaveBeenCalled()
    expect(mocks.articleUpdate.mock.calls[0][0].data.authors).toEqual({
      set: [{ id: 'association' }],
    })
  })

  test('keeps the stored state', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      state: 'archived',
    })

    await updateArticle(request, options)

    expect(mocks.articleUpdate.mock.calls[0][0].data).not.toHaveProperty(
      'state',
    )
    const pageSeo = mocks.pageSeoUpsert.mock.calls[0][0]
    expect(pageSeo.create.state).toBe('archived')
    expect(pageSeo.update).not.toHaveProperty('state')
  })

  test('answers a missing article as deleted (0036)', async () => {
    mocks.articleFindUnique.mockResolvedValue(null)

    await expect(updateArticle(request, options)).resolves.toEqual({
      status: 'deleted',
    })
    expect(mocks.withAuthorPermission).not.toHaveBeenCalled()
  })
})

describe('updateArticle — a successful save', () => {
  test('announces the update once the transaction commits', async () => {
    await updateArticle(request, options)

    expect(mocks.publishContentEvent).toHaveBeenCalledExactlyOnceWith(
      { change: 'update', entity: 'article', entityId: 'article-1' },
      mocks.permissionContext(),
    )
  })
})

describe('updateArticle — the gallery (design 24b, decision 0027)', () => {
  test('saves the alt texts and captions of the article’s own images', async () => {
    await updateArticle(request, {
      ...options,
      images: [
        { altText: 'Studovna', description: '<p>Foto</p>', id: 'image-1' },
        { altText: '', description: '', id: 'image-2' },
      ],
    })

    expect(mocks.articleImageUpdateMany.mock.calls).toEqual([
      [
        {
          data: { altText: 'Studovna', description: '<p>Foto</p>' },
          where: { articleId: 'article-1', id: 'image-1' },
        },
      ],
      [
        {
          data: { altText: '', description: null },
          where: { articleId: 'article-1', id: 'image-2' },
        },
      ],
    ])
    expect(mocks.transaction).toHaveBeenCalledWith([
      'mark-first-content',
      'delete-orphan-page-seo',
      'update-image-text',
      'update-image-text',
      'update-article',
      'upsert-page-seo',
    ])
  })

  test('leaves the images and the main image to their own saves', async () => {
    await updateArticle(request, options)

    expect(mocks.articleUpdate.mock.calls[0][0].data).not.toHaveProperty(
      'featuredImageId',
    )
  })

  test('never rewrites the sharing image of an existing PageSEO record', async () => {
    await updateArticle(request, options)

    const pageSeo = mocks.pageSeoUpsert.mock.lastCall?.[0]
    expect(pageSeo.update).not.toHaveProperty('ogImageUrl')
    expect(pageSeo.update).not.toHaveProperty('twitterImageUrl')
    expect(pageSeo.create).toHaveProperty('ogImageUrl')
  })

  test('a stored image is content of an untitled draft', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      firstContentAt: null,
    })

    await updateArticle(request, { ...options, content: '', title: '' })

    expect(mocks.articleUpdateMany.mock.lastCall?.[0].data).toEqual({
      firstContentAt: expect.any(Date),
    })
  })
})

describe('updateArticle — a submitted article', () => {
  const submittedAt = new Date('2026-09-25T10:00:00Z')

  test('is locked for its authors', async () => {
    mocks.permissionContext.mockReturnValue({
      authorId: 'author-1',
      roleLevel: 3,
    })
    mocks.articleFindUnique.mockResolvedValue({ ...storedArticle, submittedAt })

    await expect(updateArticle(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('the Coordinator corrects it and the submission and approval stay', async () => {
    mocks.articleFindUnique.mockResolvedValue({ ...storedArticle, submittedAt })

    await updateArticle(request, options)

    const articleData = mocks.articleUpdate.mock.calls[0][0].data
    expect(articleData).not.toHaveProperty('submittedAt')
    expect(articleData).not.toHaveProperty('reviews')
    expect(mocks.transaction).toHaveBeenCalledOnce()
  })
})

describe('updateArticle — the first content of a new draft (decision 0020)', () => {
  const emptyDraft = { ...storedArticle, firstContentAt: null, slug: null }

  test('marks the first content only where none is stored yet', async () => {
    await updateArticle(request, options)

    expect(mocks.articleUpdateMany).toHaveBeenCalledWith({
      data: { firstContentAt: expect.any(Date) },
      where: { firstContentAt: null, id: 'article-1' },
    })
  })

  test('is the creation in the history when it marks the draft', async () => {
    mocks.articleFindUnique.mockResolvedValue(emptyDraft)
    mocks.transaction.mockImplementation(async (writes: unknown[]) =>
      writes.map((write) =>
        write === 'update-article' ? { updatedAt: savedAt } : { count: 1 },
      ),
    )

    await updateArticle(request, options)

    expect(mocks.publishContentEvent).toHaveBeenCalledExactlyOnceWith(
      { change: 'create', entity: 'article', entityId: 'article-1' },
      mocks.permissionContext(),
    )
  })

  test('stays an update when another save marked it first', async () => {
    mocks.articleFindUnique.mockResolvedValue(emptyDraft)

    await updateArticle(request, options)

    expect(mocks.publishContentEvent.mock.lastCall?.[0].change).toBe('update')
  })

  test('marks and logs nothing without a title, text or image', async () => {
    mocks.articleFindUnique.mockResolvedValue(emptyDraft)
    mocks.articleImageCount.mockResolvedValue(0)
    mocks.transaction.mockImplementation(async (writes: unknown[]) =>
      writes.map((write) =>
        write === 'update-article' ? { updatedAt: savedAt } : { count: 1 },
      ),
    )

    await updateArticle(request, {
      ...options,
      content: '',
      images: [],
      title: '',
    })

    expect(mocks.articleUpdateMany.mock.lastCall?.[0].data).toEqual({
      firstContentAt: null,
    })
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })
})

describe('updateArticle — the PageSEO row follows the address', () => {
  test('creates it at the first address of a draft', async () => {
    mocks.articleFindUnique.mockResolvedValue({ ...storedArticle, slug: null })

    await updateArticle(request, options)

    const pageSeo = mocks.pageSeoUpsert.mock.lastCall?.[0]
    expect(pageSeo.where).toEqual({ pathname: '/articles/article' })
    expect(pageSeo.create.pathname).toBe('/articles/article')
  })

  test('moves it when the address changes', async () => {
    await updateArticle(request, { ...options, slug: 'renamed' })

    const pageSeo = mocks.pageSeoUpsert.mock.lastCall?.[0]
    expect(pageSeo.where).toEqual({ pathname: '/articles/article' })
    expect(pageSeo.update.pathname).toBe('/articles/renamed')
    expect(mocks.pageSeoDeleteMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { pathname: '/articles/renamed' },
          { pathname: { not: '/articles/article' } },
        ],
      },
    })
  })
})

describe('updateArticle — the edit hold (07g, decision 0019)', () => {
  test('saves only in the holding tab, checked in the write, and keeps the hold', async () => {
    await expect(updateArticle(request, options)).resolves.toEqual({
      slugSuggestion: null,
      status: 'saved',
      updatedAt: savedAt,
    })

    const articleWrite = mocks.articleUpdate.mock.lastCall?.[0]
    expect(articleWrite.where).toEqual({
      heldByAuthorId: 'author-1',
      heldByTabId: 'tab-1',
      id: 'article-1',
      state: 'draft',
    })
    expect(articleWrite.data).not.toHaveProperty('heldByTabId')
    expect(articleWrite.select).toEqual({ id: true, updatedAt: true })
  })

  test('the last save of a page going away releases the hold', async () => {
    await updateArticle(request, { ...options, releaseHold: true })

    expect(mocks.articleUpdate.mock.lastCall?.[0].data).toMatchObject({
      heldByAuthorId: null,
      heldByTabId: null,
      heldSince: null,
      heldUntil: null,
    })
  })

  test('another tab of one’s own: nothing is written', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      heldByTabId: 'tab-2',
    })

    await expect(updateArticle(request, options)).resolves.toEqual({
      heldByName: 'Marie Horáková',
      status: 'not-held',
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('someone else holds it: refused, naming them', async () => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      heldByAuthor: { name: 'Jakub Novák' },
      heldByAuthorId: 'author-2',
    })

    await expect(updateArticle(request, options)).resolves.toEqual({
      heldByName: 'Jakub Novák',
      status: 'not-held',
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('taken over between the check and the write: the transaction rolls back', async () => {
    mocks.transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No record', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    mocks.articleFindUnique
      .mockResolvedValueOnce(storedArticle)
      .mockResolvedValueOnce({
        ...ownHold,
        heldByAuthor: { name: 'Jakub Novák' },
        heldByAuthorId: 'author-2',
      })

    await expect(updateArticle(request, options)).resolves.toEqual({
      heldByName: 'Jakub Novák',
      status: 'not-held',
    })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('deleted between the check and the write: answers deleted (0036)', async () => {
    mocks.transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No record', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    mocks.articleFindUnique
      .mockResolvedValueOnce(storedArticle)
      .mockResolvedValueOnce(null)

    await expect(updateArticle(request, options)).resolves.toEqual({
      status: 'deleted',
    })
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('logs Upraveno once per hold (07f), announces every save', async () => {
    await updateArticle(request, options)
    expect(mocks.contentLogCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        actorId: 'author-1',
        createdAt: { gte: heldSince },
        event: { in: ['create', 'update'] },
      }),
    })
    expect(mocks.recordContentLog).toHaveBeenCalledOnce()

    mocks.contentLogCount.mockResolvedValue(1)
    await updateArticle(request, options)
    expect(mocks.recordContentLog).toHaveBeenCalledOnce()
    expect(mocks.publishContentEvent).toHaveBeenCalledTimes(2)
  })
})

describe('updateArticle — a taken address (design 24d)', () => {
  test('saves the rest, keeps the stored address and offers a free one', async () => {
    mocks.articleFindMany.mockResolvedValue([
      { slug: 'deset-knih-na-podzim' },
      { slug: 'deset-knih-na-podzim-3' },
    ])

    await expect(
      updateArticle(request, {
        ...options,
        slug: 'deset-knih-na-podzim',
        title: 'Deset knih na podzim',
      }),
    ).resolves.toEqual({
      slugSuggestion: 'deset-knih-na-podzim-2',
      status: 'saved',
      updatedAt: savedAt,
    })

    expect(mocks.articleFindMany).toHaveBeenCalledWith({
      select: { slug: true },
      where: {
        id: { not: 'article-1' },
        slug: { startsWith: 'deset-knih-na-podzim' },
      },
    })
    const articleData = mocks.articleUpdate.mock.lastCall?.[0].data
    expect(articleData.slug).toBe('article')
    expect(articleData.title).toBe('Deset knih na podzim')
    expect(mocks.pageSeoUpsert.mock.lastCall?.[0].update.pathname).toBe(
      '/articles/article',
    )
  })

  test('a new draft stays without an address and without a PageSEO row', async () => {
    mocks.articleFindUnique.mockResolvedValue({ ...storedArticle, slug: null })
    mocks.articleFindMany.mockResolvedValue([{ slug: 'article' }])

    const result = await updateArticle(request, options)

    expect(result).toMatchObject({ slugSuggestion: 'article-2' })
    expect(mocks.articleUpdate.mock.lastCall?.[0].data.slug).toBeNull()
    expect(mocks.pageSeoUpsert).not.toHaveBeenCalled()
  })

  test('taken between the check and the write: saved again without it', async () => {
    const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique', {
      clientVersion: 'test',
      code: 'P2002',
    })
    mocks.transaction
      .mockRejectedValueOnce(uniqueError)
      .mockImplementationOnce(async (writes: unknown[]) =>
        writes.map((write) =>
          write === 'update-article' ? { updatedAt: savedAt } : { count: 0 },
        ),
      )
    mocks.articleFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ slug: 'renamed' }])

    await expect(
      updateArticle(request, { ...options, slug: 'renamed' }),
    ).resolves.toMatchObject({ slugSuggestion: 'renamed-2', status: 'saved' })
    expect(mocks.articleUpdate.mock.lastCall?.[0].data.slug).toBe('article')
  })

  test('its own address is not checked', async () => {
    await updateArticle(request, options)

    expect(mocks.articleFindMany).not.toHaveBeenCalled()
  })

  test('a cleared address saves none and drops its PageSEO row', async () => {
    await updateArticle(request, { ...options, slug: '' })

    expect(mocks.articleUpdate.mock.lastCall?.[0].data.slug).toBeNull()
    expect(mocks.pageSeoUpsert).not.toHaveBeenCalled()
    expect(mocks.pageSeoDeleteMany).toHaveBeenCalledWith({
      where: { pathname: '/articles/article' },
    })
  })
})

describe('updateArticle — a missing row that is not the hold', () => {
  test('fails the save instead of calling the own tab not holding', async () => {
    const missingAuthor = new Prisma.PrismaClientKnownRequestError(
      'No record',
      { clientVersion: 'test', code: 'P2025' },
    )
    mocks.transaction.mockRejectedValue(missingAuthor)
    mocks.articleFindUnique
      .mockResolvedValueOnce(storedArticle)
      .mockResolvedValueOnce(ownHold)

    await expect(updateArticle(request, options)).rejects.toBe(missingAuthor)
  })
})

describe('updateArticle — categories and tags (design 24a, decision 0025)', () => {
  const linkedIds = () => {
    const [{ data: written }] = mocks.articleUpdate.mock.lastCall as [
      {
        data: {
          categories: { set: Array<{ id: string }> }
          tags: { set: Array<{ id: string }> }
        }
      },
    ]
    return {
      categories: written.categories.set.map(({ id }) => id),
      tags: written.tags.set.map(({ id }) => id),
    }
  }

  beforeEach(() => {
    mocks.articleFindUnique.mockResolvedValue({
      ...storedArticle,
      categories: [{ id: 'culture' }, { id: 'archived-category' }],
      tags: [{ id: 'autumn' }, { id: 'archived-tag' }],
    })
  })

  test('keeps an archived link the editor did not send', async () => {
    await updateArticle(request, {
      ...options,
      categoryIds: ['culture'],
      tagIds: ['autumn'],
    })

    expect(linkedIds()).toEqual({
      categories: ['culture', 'archived-category'],
      tags: ['autumn', 'archived-tag'],
    })
  })

  test('removes only what the editor sends as removed', async () => {
    await updateArticle(request, {
      ...options,
      categoryIds: ['culture'],
      removedCategoryIds: ['archived-category'],
      removedTagIds: ['autumn'],
      tagIds: [],
    })

    expect(linkedIds()).toEqual({
      categories: ['culture'],
      tags: ['archived-tag'],
    })
  })

  test('adds a picked one and leaves out an id that names nothing', async () => {
    mocks.articleCategoryFindMany.mockResolvedValue([{ id: 'news' }])

    await updateArticle(request, {
      ...options,
      categoryIds: ['news', 'missing'],
    })

    expect(linkedIds().categories).toEqual([
      'culture',
      'archived-category',
      'news',
    ])
  })
})
