import { Prisma } from '@generated/prisma/client'
import { data } from 'react-router'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { createDraftIssue } from './create-draft-issue.server'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  deleteStaleEmptyIssueDrafts: vi.fn(),
  findMany: vi.fn(),
  getAuthorPermissionContext: vi.fn(),
  requireAuthorPermission: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { issue: { create: mocks.create, findMany: mocks.findMany } },
}))

vi.mock(
  '~/utils/permissions/author/context/get-author-permission-context.server',
  () => ({ getAuthorPermissionContext: mocks.getAuthorPermissionContext }),
)

vi.mock(
  '~/utils/permissions/author/guards/require-author-permission.server',
  () => ({
    requireAuthorPermission: mocks.requireAuthorPermission,
  }),
)

vi.mock('./delete-stale-empty-issue-drafts.server', () => ({
  deleteStaleEmptyIssueDrafts: mocks.deleteStaleEmptyIssueDrafts,
}))

const request = new Request('https://test.local/')
const context = { authorId: 'author-1' }

const uniqueConstraintError = new Prisma.PrismaClientKnownRequestError(
  'Unique constraint failed',
  { clientVersion: 'test', code: 'P2002' },
)

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ now: new Date('2026-10-20T12:00:00Z'), toFake: ['Date'] })
  mocks.requireAuthorPermission.mockReset()
  mocks.getAuthorPermissionContext.mockResolvedValue(context)
  mocks.findMany.mockResolvedValue([{ order: 1 }, { order: 3 }])
  mocks.create.mockResolvedValue({ id: 'draft-1' })
  mocks.deleteStaleEmptyIssueDrafts.mockResolvedValue(0)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createDraftIssue', () => {
  test("creates a draft with this year and the year's next order", async () => {
    expect(await createDraftIssue(request)).toEqual({ issueId: 'draft-1' })

    expect(mocks.requireAuthorPermission).toHaveBeenCalledWith(context, {
      action: 'create',
      entity: 'issue',
      state: 'draft',
      targetAuthorIds: ['author-1'],
    })
    expect(mocks.findMany).toHaveBeenCalledWith({
      select: { order: true },
      where: { order: { not: null }, supplementSlug: '', year: 2026 },
    })
    expect(mocks.create).toHaveBeenCalledWith({
      data: { authorId: 'author-1', order: 4, year: 2026 },
      select: { id: true },
    })
  })

  test('clears the empty drafts left over before it picks the order', async () => {
    await createDraftIssue(request)

    expect(
      mocks.deleteStaleEmptyIssueDrafts.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.findMany.mock.invocationCallOrder[0])
  })

  test('still opens the draft when the clean-up fails', async () => {
    mocks.deleteStaleEmptyIssueDrafts.mockRejectedValue(
      new Error('database busy'),
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(await createDraftIssue(request)).toEqual({ issueId: 'draft-1' })
    expect(consoleError).toHaveBeenCalled()
  })

  test('takes the order after one another click took meanwhile', async () => {
    mocks.findMany
      .mockResolvedValueOnce([{ order: 1 }])
      .mockResolvedValueOnce([{ order: 1 }, { order: 2 }])
    mocks.create
      .mockRejectedValueOnce(uniqueConstraintError)
      .mockResolvedValueOnce({ id: 'draft-2' })

    expect(await createDraftIssue(request)).toEqual({ issueId: 'draft-2' })
    expect(mocks.create.mock.lastCall?.[0].data.order).toBe(3)
  })

  test('creates nothing for an author who may not create issues', async () => {
    mocks.requireAuthorPermission.mockImplementation(() => {
      throw data(null, { status: 403 })
    })

    await expect(createDraftIssue(request)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
