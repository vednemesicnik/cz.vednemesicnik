import type { Prisma, PrismaClient } from '@generated/prisma/client'
import { createId } from '@paralleldrive/cuid2'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest'

import { createTestDatabase } from '~/utils/testing/create-test-database.server'

import { uploadArticleImage } from './upload-article-image.server'

// The main image of an empty gallery (log 0053) against a real SQLite
// database: the claim's condition and uploads committing one after another
// are what a mock never runs.
const database = vi.hoisted(() => ({ prisma: null as PrismaClient | null }))

vi.mock('~/utils/db.server', () => ({
  get prisma() {
    return database.prisma
  },
}))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({
    withAuthorPermission: (
      _request: Request,
      options: { execute: (context: unknown) => Promise<unknown> },
    ) => options.execute({ authorId: 'author-1', roleLevel: 1 }),
  }),
)

vi.mock('~/utils/content-log/record-edit-log.server', () => ({
  recordEditLog: vi.fn(),
}))

vi.mock('~/utils/image-store/is-image-over-pixel-budget.server', () => ({
  isImageOverPixelBudget: async () => false,
}))

// No image store here: the rows are what is under test.
vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteImage: vi.fn(),
  deleteImageVersion: vi.fn(),
  storeImageVariants: async () => ({
    intrinsicHeight: 600,
    intrinsicWidth: 900,
    placeholderDataUrl: 'data:image/jpeg;base64,AAAA',
    version: 'v1',
  }),
}))

let cleanup: (() => Promise<void>) | undefined

const prisma = () => {
  if (database.prisma === null) throw new Error('No test database')
  return database.prisma
}

type Transaction = (
  writes: Prisma.PrismaPromise<unknown>[],
) => Promise<unknown[]>

// Runs the test with every `$transaction` going through `wrap`, then puts
// the client back.
const withTransaction = async (
  wrap: (commit: Transaction) => Transaction,
  run: () => Promise<void>,
) => {
  const realPrisma = prisma()
  const commit: Transaction = (writes) => realPrisma.$transaction(writes)
  database.prisma = new Proxy(realPrisma, {
    get: (target, property) =>
      property === '$transaction'
        ? wrap(commit)
        : Reflect.get(target, property),
  })
  try {
    await run()
  } finally {
    database.prisma = realPrisma
  }
}

const createArticle = () =>
  prisma().article.create({
    data: {
      content: 'Text',
      heldByAuthorId: 'author-1',
      heldByTabId: 'tab-1',
      heldSince: new Date(Date.now() - 60_000),
      heldUntil: new Date(Date.now() + 60_000),
      title: 'Článek',
    },
    select: { id: true },
  })

const upload = (
  articleId: string,
  request = new Request('https://test.local/'),
) =>
  uploadArticleImage(request, {
    altText: 'Alt',
    articleId,
    description: '',
    file: new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' }),
    imageId: createId(),
    tabId: 'tab-1',
  })

const readFeaturedImageId = async (articleId: string) =>
  (
    await prisma().article.findUniqueOrThrow({
      select: { featuredImageId: true },
      where: { id: articleId },
    })
  ).featuredImageId

beforeAll(async () => {
  const testDatabase = await createTestDatabase()
  database.prisma = testDatabase.prisma
  cleanup = testDatabase.cleanup

  // The migrations seed the roles.
  const role = await prisma().authorRole.upsert({
    create: { level: 1, name: 'coordinator' },
    update: {},
    where: { name: 'coordinator' },
  })
  await prisma().author.create({
    data: { id: 'author-1', name: 'Jakub Novák', roleId: role.id },
  })
}, 30_000)

afterAll(async () => {
  await cleanup?.()
})

beforeEach(async () => {
  await prisma().article.deleteMany()
})

describe('uploadArticleImage on SQLite — the first image becomes the main one', () => {
  test('the first image of an empty gallery becomes the main one', async () => {
    const { id } = await createArticle()

    const result = await upload(id)

    expect(result).toMatchObject({ becameFeatured: true, status: 'saved' })
    expect(await readFeaturedImageId(id)).not.toBeNull()
  })

  test('an image after the first one is not the main one', async () => {
    const { id } = await createArticle()
    await upload(id)
    const featuredImageId = await readFeaturedImageId(id)

    const result = await upload(id)

    expect(result).toMatchObject({ becameFeatured: false, status: 'saved' })
    expect(await readFeaturedImageId(id)).toBe(featuredImageId)
  })

  test('a main image cleared on purpose stays cleared', async () => {
    const { id } = await createArticle()
    await upload(id)
    await prisma().article.update({
      data: { featuredImageId: null },
      where: { id },
    })

    const result = await upload(id)

    expect(result).toMatchObject({ becameFeatured: false, status: 'saved' })
    expect(await readFeaturedImageId(id)).toBeNull()
  })

  test('of images uploaded together, exactly one becomes the main one', async () => {
    const { id } = await createArticle()
    let results: Awaited<ReturnType<typeof upload>>[] = []

    // Every upload has read the empty gallery before the first commits.
    let waiting = 3
    let releaseCommits = () => {}
    const allPrepared = new Promise<void>((resolve) => {
      releaseCommits = resolve
    })
    await withTransaction(
      (commit) => async (writes) => {
        waiting -= 1
        if (waiting === 0) releaseCommits()
        await allPrepared
        return commit(writes)
      },
      async () => {
        results = await Promise.all([upload(id), upload(id), upload(id)])
      },
    )

    expect(results.map(({ status }) => status)).toEqual([
      'saved',
      'saved',
      'saved',
    ])
    const featured = results.filter(
      (result) => 'becameFeatured' in result && result.becameFeatured,
    )
    expect(featured).toHaveLength(1)

    const featuredImageId = await readFeaturedImageId(id)
    const images = await prisma().articleImage.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true },
      where: { articleId: id },
    })
    expect(images).toHaveLength(3)
    // The main image stands first (0028).
    expect(images[0].id).toBe(featuredImageId)
  })

  test('a cancel during the commit leaves the article without a main image', async () => {
    const { id } = await createArticle()
    const controller = new AbortController()

    // The cancel arrives right after the commit (bxy8xxqs).
    await withTransaction(
      (commit) => async (writes) => {
        const committed = await commit(writes)
        controller.abort()
        return committed
      },
      async () => {
        const result = await upload(
          id,
          new Request('https://test.local/', { signal: controller.signal }),
        )

        expect(result).toEqual({ status: 'cancelled' })
      },
    )

    expect(await readFeaturedImageId(id)).toBeNull()
    expect(
      await prisma().articleImage.count({ where: { articleId: id } }),
    ).toBe(0)
  })
})
