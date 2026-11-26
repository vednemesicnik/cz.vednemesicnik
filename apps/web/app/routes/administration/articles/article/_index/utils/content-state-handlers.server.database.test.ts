import type { PrismaClient } from '@generated/prisma/client'
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

import { articleContentStateHandlers } from './content-state-handlers.server'

// The delete's hold condition (log 0036) against a real SQLite row: the
// expiry is a date compared by the adapter, which a mock never runs (0021).
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

// No image store here: the row write is what is under test.
vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteRowWithImages: (
    _findImageIds: unknown,
    deleteRow: () => Promise<unknown>,
  ) => deleteRow(),
}))

vi.mock('~/utils/sse/publish-content-event.server', () => ({
  publishContentEvent: vi.fn(),
}))

const request = new Request('https://test.local/')
const target = { authorIds: ['author-1'], state: 'draft' as const }
const minutesFromNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000)

let cleanup: (() => Promise<void>) | undefined

const prisma = () => {
  if (database.prisma === null) throw new Error('No test database')
  return database.prisma
}

const createArticle = (hold: {
  heldByAuthorId: string | null
  heldUntil: Date | null
}) =>
  prisma().article.create({
    data: {
      content: 'Text',
      heldByAuthorId: hold.heldByAuthorId,
      heldByTabId: hold.heldByAuthorId === null ? null : 'tab-1',
      heldSince: hold.heldByAuthorId === null ? null : minutesFromNow(-5),
      heldUntil: hold.heldUntil,
      title: 'Článek',
    },
    select: { id: true },
  })

const exists = async (id: string) =>
  (await prisma().article.findUnique({ where: { id } })) !== null

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
  await prisma().author.createMany({
    data: [
      { id: 'author-1', name: 'Jakub Novák', roleId: role.id },
      { id: 'author-2', name: 'Marie Horáková', roleId: role.id },
    ],
  })
}, 30_000)

afterAll(async () => {
  await cleanup?.()
})

beforeEach(async () => {
  await prisma().article.deleteMany()
})

describe('article delete on SQLite — it waits for every editor (0036)', () => {
  test('a free article is deleted', async () => {
    const { id } = await createArticle({
      heldByAuthorId: null,
      heldUntil: null,
    })

    await articleContentStateHandlers.delete(request, { id, target })

    expect(await exists(id)).toBe(false)
  })

  test('one’s own editor in another tab keeps it, and says so', async () => {
    const { id } = await createArticle({
      heldByAuthorId: 'author-1',
      heldUntil: minutesFromNow(1),
    })

    await expect(
      articleContentStateHandlers.delete(request, { id, target }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Jakub Novák', isOwnOtherTab: true },
      init: { status: 409 },
    })
    expect(await exists(id)).toBe(true)
  })

  test('someone else’s editor keeps it', async () => {
    const { id } = await createArticle({
      heldByAuthorId: 'author-2',
      heldUntil: minutesFromNow(1),
    })

    await expect(
      articleContentStateHandlers.delete(request, { id, target }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Marie Horáková', isOwnOtherTab: false },
    })
    expect(await exists(id)).toBe(true)
  })

  test('an expired hold does not stop it', async () => {
    const { id } = await createArticle({
      heldByAuthorId: 'author-2',
      heldUntil: minutesFromNow(-1),
    })

    await articleContentStateHandlers.delete(request, { id, target })

    expect(await exists(id)).toBe(false)
  })
})
