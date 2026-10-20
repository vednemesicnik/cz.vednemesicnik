import { Prisma } from '@generated/prisma/client'
import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { updateIssue } from './update-issue.server'

// Mocked Prisma whose queued writes return tags, so the test sees what went
// into the transaction.
const mocks = vi.hoisted(() => ({
  checkAuthorPermission: vi.fn(),
  deleteStaleEmptyIssueDrafts: vi.fn(),
  findIssueNumberConflict: vi.fn(),
  getAuthorPermissionContext: vi.fn(),
  issueCount: vi.fn(),
  issueCoverUpdate: vi.fn(),
  issueFindMany: vi.fn(),
  issueFindUnique: vi.fn(),
  issuePdfCount: vi.fn(),
  issuePdfUpdate: vi.fn(),
  issueUpdate: vi.fn(),
  issueUpdateMany: vi.fn(),
  recordEditLog: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    $transaction: mocks.transaction,
    issue: {
      count: mocks.issueCount,
      findMany: mocks.issueFindMany,
      findUnique: mocks.issueFindUnique,
      update: mocks.issueUpdate,
      updateMany: mocks.issueUpdateMany,
    },
    issueCover: { update: mocks.issueCoverUpdate },
    issuePDF: { count: mocks.issuePdfCount, update: mocks.issuePdfUpdate },
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

vi.mock('../../../utils/find-issue-number-conflict.server', () => ({
  findIssueNumberConflict: mocks.findIssueNumberConflict,
}))

vi.mock(
  '../../../add-issue/utils/delete-stale-empty-issue-drafts.server',
  () => ({ deleteStaleEmptyIssueDrafts: mocks.deleteStaleEmptyIssueDrafts }),
)

const request = new Request('https://test.local/')

const options = {
  issueId: 'issue-1',
  name: 'podzim',
  number: { order: 4, supplement: null, year: 2026 },
  tabId: 'tab-1',
} satisfies Parameters<typeof updateIssue>[1]

// The saving tab holds the issue (decision 0019).
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

const conflict = {
  after: ' už existuje.',
  before: 'Zvolte jiné pořadí — číslo ',
  field: 'order',
  holder: { id: 'issue-4', label: '4/2026' },
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
  mocks.findIssueNumberConflict.mockReset()
  mocks.findIssueNumberConflict.mockResolvedValue(null)
  mocks.issueFindUnique.mockResolvedValue(storedIssue)
  mocks.issueFindMany.mockResolvedValue([{ order: 1 }, { order: 4 }])
  // No empty draft holds the number and no other PDF has the name.
  mocks.issueCount.mockResolvedValue(0)
  mocks.issuePdfCount.mockResolvedValue(0)
  mocks.issueUpdateMany.mockReturnValue('mark-first-content')
  mocks.issueUpdate.mockReturnValue('update-issue')
  mocks.issueCoverUpdate.mockReturnValue('update-cover')
  mocks.issuePdfUpdate.mockReturnValue('update-pdf')
  mocks.deleteStaleEmptyIssueDrafts.mockResolvedValue(0)
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
      isNumberSaved: true,
      numberConflict: null,
      status: 'saved',
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
    expect(mocks.findIssueNumberConflict).not.toHaveBeenCalled()
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

describe('updateIssue — the number saves as one (decision 0032)', () => {
  test('leaves a taken number out and saves the rest, with a free order', async () => {
    mocks.findIssueNumberConflict.mockResolvedValue(conflict)

    expect(await updateIssue(request, options)).toEqual({
      isNumberSaved: false,
      numberConflict: { ...conflict, freeOrder: 5 },
      status: 'saved',
      updatedAt: savedAt,
    })
    expect(savedData()).toMatchObject({
      name: 'podzim',
      order: 3,
      supplementSlug: '',
      year: 2026,
    })
    expect(mocks.issueFindMany.mock.lastCall?.[0].where).toEqual({
      id: { not: 'issue-1' },
      order: { not: null },
      supplementSlug: '',
      year: 2026,
    })
  })

  test('offers no free order for a taken supplement', async () => {
    mocks.findIssueNumberConflict.mockResolvedValue({
      ...conflict,
      field: 'supplement',
    })

    const result = await updateIssue(request, {
      ...options,
      number: { order: 2, supplement: 'Maturitní ples', year: 2026 },
    })

    expect(result).toMatchObject({ numberConflict: { freeOrder: null } })
  })

  test('keeps the stored number when the editor sent one it could not read', async () => {
    const result = await updateIssue(request, { ...options, number: null })

    expect(result).toMatchObject({ isNumberSaved: false })
    expect(savedData()).toMatchObject({ name: 'podzim', order: 3, year: 2026 })
    expect(mocks.findIssueNumberConflict).not.toHaveBeenCalled()
  })

  test('clears an empty draft left over from a click that holds the number', async () => {
    mocks.issueCount.mockResolvedValue(1)
    mocks.findIssueNumberConflict
      .mockResolvedValueOnce({
        ...conflict,
        holder: { id: null, label: '4/2026' },
      })
      .mockResolvedValueOnce(null)

    const result = await updateIssue(request, options)

    expect(mocks.deleteStaleEmptyIssueDrafts).toHaveBeenCalledWith({
      excludeId: 'issue-1',
    })
    expect(result).toMatchObject({ numberConflict: null })
    expect(savedData()).toMatchObject({ order: 4 })
  })

  test('saves without the number another issue took meanwhile', async () => {
    mocks.transaction
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          clientVersion: 'test',
          code: 'P2002',
        }),
      )
      .mockImplementation(async (writes: unknown[]) =>
        writes.map((write) =>
          write === 'update-issue' ? { updatedAt: savedAt } : { count: 0 },
        ),
      )
    mocks.findIssueNumberConflict
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(conflict)

    const result = await updateIssue(request, options)

    expect(result).toMatchObject({ numberConflict: { field: 'order' } })
    expect(savedData()).toMatchObject({ order: 3 })
  })

  test('renames the PDF of a draft with its number', async () => {
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      pdf: { fileName: 'VDM-2026-3.pdf', id: 'pdf-1' },
    })

    await updateIssue(request, options)

    expect(mocks.issuePdfUpdate).toHaveBeenCalledWith({
      data: { fileName: 'VDM-2026-4.pdf' },
      select: { id: true },
      where: { id: 'pdf-1' },
    })
  })

  test('sweeps nothing for a holder the editor may not see', async () => {
    mocks.findIssueNumberConflict.mockResolvedValue({
      ...conflict,
      holder: { id: null, label: '4/2026' },
    })

    await updateIssue(request, options)

    expect(mocks.deleteStaleEmptyIssueDrafts).not.toHaveBeenCalled()
  })

  test('keeps the PDF name another issue still has', async () => {
    mocks.issueFindUnique.mockResolvedValue({
      ...storedIssue,
      pdf: { fileName: 'VDM-2026-3.pdf', id: 'pdf-1' },
    })
    mocks.issuePdfCount.mockResolvedValue(1)

    await updateIssue(request, options)

    expect(mocks.issuePdfUpdate).not.toHaveBeenCalled()
    expect(savedData()).toMatchObject({ order: 4 })
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

  test('is a 404 for a missing issue', async () => {
    mocks.issueFindUnique.mockResolvedValue(null)

    await expect(updateIssue(request, options)).rejects.toMatchObject({
      init: { status: 404 },
    })
  })
})
