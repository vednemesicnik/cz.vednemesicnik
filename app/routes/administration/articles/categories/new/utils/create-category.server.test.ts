import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createCategory } from './create-category.server'

const mocks = vi.hoisted(() => ({
  articleCategoryCreate: vi.fn(),
  articleCategoryFindMany: vi.fn(),
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
    articleCategory: {
      create: mocks.articleCategoryCreate,
      findMany: mocks.articleCategoryFindMany,
    },
  },
}))

const COORDINATOR_LEVEL = 1
const CONTRIBUTOR_LEVEL = 3

const request = new Request('https://test.local/')

type Can = (config: { targetAuthorIds?: string[] }) => boolean

const createContext = (roleLevel: number, can: Can = () => true) => ({
  authorId: 'author-1',
  authorName: 'Marie Horáková',
  can: vi.fn((config: { targetAuthorIds?: string[] }) => {
    const hasPermission = can(config)
    return { hasAny: hasPermission, hasOwn: hasPermission, hasPermission }
  }),
  roleLevel,
})

const options = {
  intent: 'save-draft',
  name: 'Kultura',
  requestedAuthorId: undefined,
  slug: 'kultura',
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getAuthorPermissionContext.mockResolvedValue(
    createContext(CONTRIBUTOR_LEVEL),
  )
  mocks.articleCategoryFindMany.mockResolvedValue([])
  mocks.articleCategoryCreate.mockResolvedValue({ id: 'category-1' })
})

describe('createCategory', () => {
  test('creates for the creator whatever author a Contributor sends', async () => {
    await expect(
      createCategory(request, { ...options, requestedAuthorId: 'author-2' }),
    ).resolves.toEqual({
      authorId: 'author-1',
      id: 'category-1',
      status: 'success',
    })

    expect(mocks.articleCategoryCreate.mock.lastCall?.[0].data).toEqual({
      authorId: 'author-1',
      name: 'Kultura',
      slug: 'kultura',
    })
  })

  test("creates for the Coordinator's chosen author, checked for them", async () => {
    const context = createContext(COORDINATOR_LEVEL)
    mocks.getAuthorPermissionContext.mockResolvedValue(context)

    await createCategory(request, { ...options, requestedAuthorId: 'author-2' })

    expect(context.can).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        targetAuthorIds: ['author-2'],
      }),
    )
    expect(mocks.articleCategoryCreate.mock.lastCall?.[0].data.authorId).toBe(
      'author-2',
    )
  })

  test('refuses an author the Coordinator may not create for', async () => {
    mocks.getAuthorPermissionContext.mockResolvedValue(
      createContext(
        COORDINATOR_LEVEL,
        ({ targetAuthorIds }) => targetAuthorIds?.[0] === 'author-1',
      ),
    )

    await expect(
      createCategory(request, { ...options, requestedAuthorId: 'author-2' }),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(mocks.articleCategoryCreate).not.toHaveBeenCalled()
  })

  test.each([
    [CONTRIBUTOR_LEVEL, 'publish'],
    [COORDINATOR_LEVEL, 'submit-for-review'],
  ])(
    'role level %i may not %s from the add page',
    async (roleLevel, intent) => {
      mocks.getAuthorPermissionContext.mockResolvedValue(
        createContext(roleLevel),
      )

      await expect(
        createCategory(request, { ...options, intent }),
      ).rejects.toMatchObject({ init: { status: 403 } })
      expect(mocks.articleCategoryCreate).not.toHaveBeenCalled()
    },
  )

  test('answers a taken address with a free suggestion and writes nothing', async () => {
    mocks.articleCategoryFindMany.mockResolvedValue([
      { name: 'Kultura a umění', slug: 'kultura' },
    ])

    await expect(createCategory(request, options)).resolves.toEqual({
      isNameTaken: false,
      slugSuggestion: 'kultura-2',
      status: 'conflict',
    })
    expect(mocks.articleCategoryCreate).not.toHaveBeenCalled()
  })

  test('answers a name taken in another letter case', async () => {
    mocks.articleCategoryFindMany.mockResolvedValue([
      { name: 'kultura', slug: 'kultura-a-umeni' },
    ])

    await expect(createCategory(request, options)).resolves.toEqual({
      isNameTaken: true,
      slugSuggestion: null,
      status: 'conflict',
    })
  })

  test('answers an address taken between the check and the write', async () => {
    mocks.articleCategoryFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ name: 'Kultura', slug: 'kultura' }])
    mocks.articleCategoryCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        clientVersion: 'test',
        code: 'P2002',
      }),
    )

    await expect(createCategory(request, options)).resolves.toEqual({
      isNameTaken: true,
      slugSuggestion: 'kultura-2',
      status: 'conflict',
    })
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('announces the created category', async () => {
    await createCategory(request, options)

    expect(mocks.publishContentEvent).toHaveBeenCalledExactlyOnceWith(
      {
        change: 'create',
        entity: 'article_category',
        entityId: 'category-1',
      },
      expect.objectContaining({ authorId: 'author-1' }),
    )
  })
})
