import { Prisma } from '@generated/prisma/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { issueContentStateHandlers } from './content-state-handlers.server'

// Pass-through permission wrapper and mocked Prisma, so this exercises the
// issue config's writes and their hold condition (decision 0019).
const mocks = vi.hoisted(() => ({
  issueFindUnique: vi.fn(),
  issueFindUniqueOrThrow: vi.fn(),
  issueUpdate: vi.fn(),
  recordContentLog: vi.fn(),
  reviewFindFirst: vi.fn(),
}))

vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: mocks.recordContentLog,
}))

vi.mock('~/utils/content-log/delete-content-log.server', () => ({
  deleteContentLog: vi.fn(),
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

vi.mock('~/utils/db.server', () => ({
  prisma: {
    issue: {
      findUnique: mocks.issueFindUnique,
      findUniqueOrThrow: mocks.issueFindUniqueOrThrow,
      update: mocks.issueUpdate,
    },
    review: { findFirst: mocks.reviewFindFirst },
  },
}))

const request = new Request('https://test.local/')
const draftTarget = { authorIds: ['author-2'], state: 'draft' as const }
const publishedTarget = { authorIds: ['author-2'], state: 'published' as const }

// What a publish reads: the Coordinator's own approval is not needed.
const publishState = {
  author: { role: { level: 3 } },
  publishedAt: null,
  reviews: [],
  submittedAt: null,
}

// Not while someone else than the actor edits it (decision 0019).
const notHeldByOthers = {
  AND: [{ OR: expect.arrayContaining([{ heldByAuthorId: 'author-1' }]) }],
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.issueUpdate.mockResolvedValue({ id: 'i1' })
  mocks.issueFindUniqueOrThrow.mockResolvedValue(publishState)
  mocks.reviewFindFirst.mockResolvedValue({ id: 'review-1' })
  // Nobody holds it, unless a test says so.
  mocks.issueFindUnique.mockResolvedValue(null)
})

describe('issueContentStateHandlers — the edit hold', () => {
  test('publishing writes only while nobody else edits it, and ends one’s own hold', async () => {
    await issueContentStateHandlers.publish(request, {
      id: 'i1',
      target: draftTarget,
    })

    const write = mocks.issueUpdate.mock.lastCall?.[0]
    expect(write.where).toEqual({ ...notHeldByOthers, id: 'i1' })
    expect(write.data).toMatchObject({
      heldByAuthorId: null,
      heldByTabId: null,
      heldSince: null,
      heldUntil: null,
      state: 'published',
    })
  })

  test('retracting keeps the hold columns as they are', async () => {
    await issueContentStateHandlers.retract(request, {
      id: 'i1',
      target: publishedTarget,
    })

    expect(mocks.issueUpdate.mock.lastCall?.[0].data).not.toHaveProperty(
      'heldByAuthorId',
    )
  })

  test('a transition on an issue someone else edits is refused, naming them (26i)', async () => {
    mocks.issueUpdate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No record', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    mocks.issueFindUnique.mockResolvedValue({
      heldByAuthor: { name: 'Jakub Novák' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-2',
      heldSince: new Date(Date.now() - 60_000),
      heldUntil: new Date(Date.now() + 60_000),
    })

    await expect(
      issueContentStateHandlers.retract(request, {
        id: 'i1',
        target: publishedTarget,
      }),
    ).rejects.toMatchObject({
      data: { heldByName: 'Jakub Novák' },
      init: { status: 409 },
    })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })
})
