import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createDraftIssue } from './create-draft-issue.server'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  deleteStaleEmptyIssueDrafts: vi.fn(),
  getAuthorPermissionContext: vi.fn(),
  requireAuthorPermission: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { issue: { create: mocks.create } },
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

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireAuthorPermission.mockReset()
  mocks.getAuthorPermissionContext.mockResolvedValue(context)
  mocks.create.mockResolvedValue({ id: 'draft-1' })
  mocks.deleteStaleEmptyIssueDrafts.mockResolvedValue(0)
})

describe('createDraftIssue', () => {
  test('creates a draft without a year or an order', async () => {
    expect(await createDraftIssue(request)).toEqual({ issueId: 'draft-1' })

    expect(mocks.requireAuthorPermission).toHaveBeenCalledWith(context, {
      action: 'create',
      entity: 'issue',
      state: 'draft',
      targetAuthorIds: ['author-1'],
    })
    expect(mocks.create).toHaveBeenCalledWith({
      data: { authorId: 'author-1' },
      select: { id: true },
    })
  })

  test('clears the empty drafts left over before it creates one', async () => {
    await createDraftIssue(request)

    expect(
      mocks.deleteStaleEmptyIssueDrafts.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.create.mock.invocationCallOrder[0])
  })

  test('still opens the draft when the clean-up fails', async () => {
    mocks.deleteStaleEmptyIssueDrafts.mockRejectedValue(
      new Error('database busy'),
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(await createDraftIssue(request)).toEqual({ issueId: 'draft-1' })
    expect(consoleError).toHaveBeenCalled()
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
