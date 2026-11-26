import { Prisma } from '@generated/prisma/client'
import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { updateIssue } from './update-issue.server'

// Mocked Prisma whose queued writes return tags, so the test sees what went
// into the transaction.
const mocks = vi.hoisted(() => ({
  checkAuthorPermission: vi.fn(),
  findPublishedNumberConflict: vi.fn(),
  getAuthorPermissionContext: vi.fn(),
  issueCoverUpdate: vi.fn(),
  issueFindUnique: vi.fn(),
  issueUpdate: vi.fn(),
  issueUpdateMany: vi.fn(),
  recordEditLog: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    $transaction: mocks.transaction,
    issue: {
      findUnique: mocks.issueFindUnique,
      update: mocks.issueUpdate,
      updateMany: mocks.issueUpdateMany,
    },
    issueCover: { updateMany: mocks.issueCoverUpdate },
  },
}))

vi.mock(
  '~/utils/permissions/author/context/get-author-permission-context.server',
  () => ({ getAuthorPermissionContext: mocks.getAuthorPermissionContext }),
)

vi.mock(
  '~/utils/permissions/author/guards/check-author-permission.server',
  () => ({ checkAuthorPermission: mocks.checkAuthorPermission }),
)

vi.mock('~/utils/content-log/record-edit-log.server', () => ({
  recordEditLog: mocks.recordEditLog,
}))

vi.mock('../../../utils/find-published-number-conflict.server', () => ({
  findPublishedNumberConflict: mocks.findPublishedNumberConflict,
}))

const request = new Request('https://test.local/')

const options = {
  issueId: 'issue-1',
  name: 'podzim',
  number: { order: 4, supplement: null, year: 2026 },
  tabId: 'tab-1',
} satisfies Parameters<typeof updateIssue>[1]

// The saving tab holds the issue (log 0019).
const heldSince = new Date(Date.now() - 60_000)
const ownHold = {
  heldByAuthor: { name: 'Marie Horáková' },
  heldByAuthorId: 'author-1',
  heldByTabId: 'tab-1',
  heldSince,
  heldUntil: new Date(Date.now() + 60_000),
}

const savedAt = new Date('2026-10-20T12:06:00Z')

const storedIssue = {
  authorId: 'author-1',
  cover: null,
  firstContentAt: new Date('2026-10-20T10:00:00Z'),
  ...ownHold,
  order: 3,
  pdf: null,
  state: 'draft',
  submittedAt: null,
  supplement: null,
  supplementSlug: '',
  year: 2026,
}

// What the issue write sent as its data.
const savedData = () => mocks.issueUpdate.mock.lastCall?.[0].data

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getAuthorPermissionContext.mockResolvedValue({
    authorId: 'author-1',
    roleLevel: 3,
  })
  // clearAllMocks keeps implementations; a test's denial must not leak.
  mocks.checkAuthorPermission.mockReset()
  mocks.findPublishedNumberConflict.mockReset()
  mocks.findPublishedNumberConflict.mockResolvedValue(null)
  mocks.issueFindUnique.mockResolvedValue(storedIssue)
  mocks.issueUpdateMany.mockReturnValue('mark-first-content')
  mocks.issueUpdate.mockReturnValue('update-issue')
  mocks.issueCoverUpdate.mockReturnValue('update-cover')
  // The first entry is the first-content mark; 0 rows: not the first save.
  mocks.transaction.mockImplementation(async (writes: unknown[]) =>
    writes.map((write) =>
      write === 'update-issue' ? { updatedAt: savedAt } : { count: 0 },
    ),
  )
})

describe('updateIssue — the save', () => {
  test('saves the fields from the holding tab and keeps the hold', async () => {
    expect(await updateIssue(request, options)).toEqual({
      freeOrder: null,
      status: 'saved',
      takenNumber: null,
      updatedAt: savedAt,
    })

    expect(savedData()).toEqual({
      authorId: 'author-1',
      name: 'podzim',
      order: 4,
      supplement: null,
      supplementSlug: '',
      year: 2026,
    })
    expect(mocks.issueUpdate.mock.lastCall?.[0].where).toEqual({
      heldByAuthorId: 'author-1',
      heldByTabId: 'tab-1',
      id: 'issue-1',
      state: 'draft',
    })
  })

  test('saves a draft without its year and order', async () => {
    await updateIssue(request, {
      ...options,
      name: '',
      number: { order: null, supplement: null, year: null },
    })

    expect(savedData()).toMatchObject({ name: null, order: null, year: null })
  })

  test('slugs the supplement for the unique key', async () => {
    await updateIssue(request, {
      ...options,
      number: { order: 2, supplement: 'Maturitní ples', year: 2026 },
    })

    expect(savedData()).toMatchObject({
      supplement: 'Maturitní ples',
      supplementSlug: 'maturitni-ples',
    })
  })

  test('ends the hold with the save of a page going away', async () => {
    await updateIssue(request, { ...options, releaseHold: true })

    expect(savedData()).toMatchObject({
      heldByAuthorId: null,
      heldByTabId: null,
      heldSince: null,
      heldUntil: null,
    })
  })

  test('logs the creation with the first save', async () => {
    mocks.transaction.mockImplementation(async (writes: unknown[]) =>
      writes.map((write) =>
        write === 'update-issue' ? { updatedAt: savedAt } : { count: 1 },
      ),
    )

    await updateIssue(request, options)

    expect(mocks.recordEditLog).toHaveBeenCalledWith(
      { authorId: 'author-1', roleLevel: 3 },
      {
        entity: 'issue',
        entityId: 'issue-1',
        heldSince,
        isCreation: true,
      },
    )
  })

  test('logs an edit after the first save', async () => {
    await updateIssue(request, options)

    expect(mocks.recordEditLog.mock.lastCall?.[1].isCreation).toBe(false)
  })
})

describe('updateIssue — the number saves as one (log 0034)', () => {
  test('saves a taken number as typed and says so, with a free order (log 0039)', async () => {
    mocks.findPublishedNumberConflict.mockResolvedValue({
      freeOrder: 5,
      takenNumber: '2026-4',
    })

    expect(await updateIssue(request, options)).toEqual({
      freeOrder: 5,
      status: 'saved',
      takenNumber: '2026-4',
      updatedAt: savedAt,
    })
    expect(savedData()).toMatchObject({
      name: 'podzim',
      order: 4,
      supplementSlug: '',
      year: 2026,
    })
    expect(mocks.findPublishedNumberConflict).toHaveBeenCalledWith({
      issueId: 'issue-1',
      order: 4,
      supplementSlug: '',
      year: 2026,
    })
  })

  test('checks a supplement by its slug', async () => {
    await updateIssue(request, {
      ...options,
      number: { order: 2, supplement: 'Maturitní ples', year: 2026 },
    })

    expect(mocks.findPublishedNumberConflict).toHaveBeenCalledWith(
      expect.objectContaining({ supplementSlug: 'maturitni-ples' }),
    )
  })

  test('keeps the stored number when the editor sent one it could not read', async () => {
    await updateIssue(request, { ...options, number: null })

    expect(savedData()).toMatchObject({ name: 'podzim', order: 3, year: 2026 })
    expect(mocks.findPublishedNumberConflict).toHaveBeenCalledWith(
      expect.objectContaining({ order: 3, year: 2026 }),
    )
  })

  test('keeps the cover alt text while the number is incomplete', async () => {
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      cover: { id: 'cover-1' },
    })

    await updateIssue(request, {
      ...options,
      number: { order: null, supplement: null, year: 2026 },
    })

    expect(mocks.issueCoverUpdate).not.toHaveBeenCalled()
  })

  test('sets the cover alt text from the new title', async () => {
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      cover: { id: 'cover-1' },
    })

    await updateIssue(request, options)

    expect(mocks.issueCoverUpdate.mock.lastCall?.[0].data).toEqual({
      altText: 'Obálka čísla podzim 2026',
    })
  })
})

describe('updateIssue — who may save', () => {
  test('refuses another tab and says who holds it', async () => {
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      heldByAuthor: { name: 'Jakub Novák' },
      heldByAuthorId: 'author-2',
      heldByTabId: 'tab-2',
    })

    expect(await updateIssue(request, options)).toEqual({
      heldByName: 'Jakub Novák',
      status: 'not-held',
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('deleted between the check and the write: answers deleted (0036)', async () => {
    mocks.transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No record', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    )
    mocks.issueFindUnique
      .mockResolvedValueOnce(storedIssue)
      .mockResolvedValueOnce(null)

    expect(await updateIssue(request, options)).toEqual({ status: 'deleted' })
  })

  test("refuses a Creator's other author", async () => {
    await expect(
      updateIssue(request, { ...options, authorId: 'author-2' }),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test('lets the Coordinator choose the author', async () => {
    mocks.getAuthorPermissionContext.mockResolvedValue({
      authorId: 'author-1',
      roleLevel: 1,
    })

    await updateIssue(request, { ...options, authorId: 'author-2' })

    expect(savedData()).toMatchObject({ authorId: 'author-2' })
    expect(mocks.checkAuthorPermission).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ targetAuthorIds: ['author-2'] }),
    )
  })

  test('refuses an edit the stored issue does not allow', async () => {
    mocks.checkAuthorPermission.mockImplementation(() => {
      throw data(null, { status: 403 })
    })

    await expect(updateIssue(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
  })

  test('refuses an author their submitted issue', async () => {
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      submittedAt: new Date(),
    })

    await expect(updateIssue(request, options)).rejects.toMatchObject({
      init: { status: 403 },
    })
  })

  test('keeps the approvals of a submitted issue the Coordinator corrects (07d, 26e)', async () => {
    mocks.getAuthorPermissionContext.mockResolvedValue({
      authorId: 'author-1',
      roleLevel: 1,
    })
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      submittedAt: new Date(),
    })

    expect(await updateIssue(request, options)).toMatchObject({
      status: 'saved',
    })
    expect(savedData()).not.toHaveProperty('reviews')
    expect(savedData()).not.toHaveProperty('submittedAt')
  })

  test('answers a missing issue as deleted (0036)', async () => {
    mocks.issueFindUnique.mockResolvedValue(null)

    await expect(updateIssue(request, options)).resolves.toEqual({
      status: 'deleted',
    })
  })
})
