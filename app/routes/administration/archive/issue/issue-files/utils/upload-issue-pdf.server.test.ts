import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ISSUE_FILE_CONFIG } from '~/config/issue-file-config'

import type { FileChangeIssue } from './save-issue-file-change.server'
import { uploadIssuePdf } from './upload-issue-pdf.server'

const mocks = vi.hoisted(() => ({
  createId: vi.fn(),
  deletePdfObject: vi.fn(),
  issueFindUniqueOrThrow: vi.fn(),
  issuePdfCount: vi.fn(),
  issuePdfCreate: vi.fn(),
  issuePdfDelete: vi.fn(),
  issuePdfFindUnique: vi.fn(),
  issuePdfUpdate: vi.fn(),
  saveIssueFileChange: vi.fn(),
  storePdf: vi.fn(),
}))

vi.mock('@paralleldrive/cuid2', () => ({ createId: mocks.createId }))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    issue: { findUniqueOrThrow: mocks.issueFindUniqueOrThrow },
    issuePDF: {
      count: mocks.issuePdfCount,
      create: mocks.issuePdfCreate,
      delete: mocks.issuePdfDelete,
      findUnique: mocks.issuePdfFindUnique,
      update: mocks.issuePdfUpdate,
    },
  },
}))

vi.mock('~/utils/pdf-store/store-pdf.server', () => ({
  deletePdfObject: mocks.deletePdfObject,
  PDF_CONTENT_TYPE: 'application/pdf',
  storePdf: mocks.storePdf,
}))

vi.mock('./save-issue-file-change.server', () => ({
  saveIssueFileChange: mocks.saveIssueFileChange,
}))

const request = new Request('https://test.local/')

const issue: FileChangeIssue = {
  cover: null,
  name: 'podzim',
  order: 4,
  pdf: null,
  state: 'draft',
  supplement: null,
  supplementSlug: '',
  year: 2026,
}

const pdfFile = () =>
  new File(['%PDF'], 'podzim_zlom_v3.pdf', { type: 'application/pdf' })

// `stored` is the issue as the change read it; `current` as it is once the
// file is stored, which names it.
const run = async (
  stored: Partial<FileChangeIssue> = {},
  current: Partial<FileChangeIssue> = stored,
) => {
  mocks.issueFindUniqueOrThrow.mockResolvedValue({ ...issue, ...current })
  await uploadIssuePdf(request, {
    file: pdfFile(),
    issueId: 'issue-1',
    tabId: 'tab-1',
  })
  const { prepare } = mocks.saveIssueFileChange.mock.lastCall?.[1] ?? {}
  return prepare({ ...issue, ...stored })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.createId.mockReturnValue('pdf-new')
  mocks.saveIssueFileChange.mockResolvedValue({ status: 'saved' })
  mocks.storePdf.mockResolvedValue(undefined)
  mocks.deletePdfObject.mockResolvedValue(undefined)
  mocks.issuePdfCount.mockResolvedValue(0)
  mocks.issuePdfCreate.mockReturnValue('create-pdf')
  mocks.issuePdfUpdate.mockReturnValue('update-pdf')
  mocks.issuePdfFindUnique.mockResolvedValue({
    contentType: 'application/pdf',
    fileName: 'VDM-2026-4.pdf',
    id: 'pdf-old',
    originalFileName: 'podzim_zlom_v2.pdf',
    uploadedAt: new Date('2026-10-01T10:00:00Z'),
  })
})

describe('uploadIssuePdf — the input', () => {
  test.each([
    ['an empty file', new File([], 'empty.pdf', { type: 'application/pdf' })],
    [
      'a file over the limit',
      new File(
        [new Uint8Array(ISSUE_FILE_CONFIG.pdf.maxFileBytes + 1)],
        'big.pdf',
        { type: 'application/pdf' },
      ),
    ],
    [
      'a file that is not a PDF',
      new File(['text'], 'podzim.docx', { type: 'application/msword' }),
    ],
  ])('answers 400 for %s', async (_name, file) => {
    await expect(
      uploadIssuePdf(request, { file, issueId: 'issue-1', tabId: 'tab-1' }),
    ).rejects.toMatchObject({ init: { status: 400 } })

    expect(mocks.saveIssueFileChange).not.toHaveBeenCalled()
  })

  test('is cancellable and lands without the hold', async () => {
    await run()

    expect(mocks.saveIssueFileChange).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        isCancellable: true,
        issueId: 'issue-1',
        landsWithoutHold: true,
        tabId: 'tab-1',
      }),
    )
  })
})

describe('uploadIssuePdf — a new PDF', () => {
  test('stores it under a fresh id and creates the row by the number', async () => {
    const prepared = await run()

    expect(mocks.storePdf).toHaveBeenCalledWith('pdf-new', expect.any(File))
    expect(mocks.issuePdfCreate).toHaveBeenCalledWith({
      data: {
        contentType: 'application/pdf',
        fileName: 'VDM-2026-4.pdf',
        id: 'pdf-new',
        issueId: 'issue-1',
        originalFileName: 'podzim_zlom_v3.pdf',
      },
      select: { id: true },
    })
    expect(prepared).toMatchObject({
      addsContent: true,
      logEvent: 'pdf_uploaded',
      writes: ['create-pdf'],
    })
  })

  test('has no name without the year or the order (decision 0033)', async () => {
    await run({ year: null })

    expect(mocks.issuePdfCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fileName: null }),
      }),
    )
    expect(mocks.issuePdfCount).not.toHaveBeenCalled()
  })

  test('is named by the number as it is once the file is stored', async () => {
    // An autosave moved the order while the file was stored.
    await run({}, { order: 5 })

    expect(mocks.issuePdfCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fileName: 'VDM-2026-5.pdf' }),
      }),
    )
  })

  test('has no name while another PDF still has it', async () => {
    mocks.issuePdfCount.mockResolvedValue(1)

    await run()

    expect(mocks.issuePdfCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fileName: null }),
      }),
    )
  })

  test('a failed store answers failed and drops what landed', async () => {
    mocks.storePdf.mockRejectedValue(new Error('store down'))

    const prepared = await run()

    expect(prepared).toEqual({ status: 'failed' })
    expect(mocks.deletePdfObject).toHaveBeenCalledWith('pdf-new')
  })

  test('a cancel after the commit deletes the row and the object', async () => {
    const prepared = await run()
    await prepared.onCancelled()

    expect(mocks.issuePdfDelete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: 'pdf-new' },
    })
    expect(mocks.deletePdfObject).toHaveBeenCalledWith('pdf-new')
  })
})

describe('uploadIssuePdf — a replacement', () => {
  const stored = { pdf: { fileName: 'VDM-2026-4.pdf', id: 'pdf-old' } }

  test('points the row at the new object and keeps the name', async () => {
    const prepared = await run(stored)

    expect(mocks.issuePdfUpdate).toHaveBeenCalledWith({
      data: {
        contentType: 'application/pdf',
        fileName: 'VDM-2026-4.pdf',
        id: 'pdf-new',
        originalFileName: 'podzim_zlom_v3.pdf',
        uploadedAt: expect.any(Date),
      },
      select: { id: true },
      where: { id: 'pdf-old' },
    })
    expect(prepared).not.toHaveProperty('addsContent')
  })

  test('the old object goes only after the commit', async () => {
    const prepared = await run(stored)
    expect(mocks.deletePdfObject).not.toHaveBeenCalled()

    await prepared.onCommitted()

    expect(mocks.deletePdfObject).toHaveBeenCalledWith('pdf-old')
  })

  test('a cancel after the commit puts the row back on the old object', async () => {
    const prepared = await run(stored)
    await prepared.onCancelled()

    expect(mocks.issuePdfUpdate).toHaveBeenLastCalledWith({
      data: {
        contentType: 'application/pdf',
        fileName: 'VDM-2026-4.pdf',
        id: 'pdf-old',
        originalFileName: 'podzim_zlom_v2.pdf',
        uploadedAt: new Date('2026-10-01T10:00:00Z'),
      },
      select: { id: true },
      where: { id: 'pdf-new' },
    })
    expect(mocks.deletePdfObject).toHaveBeenCalledWith('pdf-new')
  })

  test('a PDF removed while the file was stored fails and drops the object', async () => {
    mocks.issuePdfFindUnique.mockResolvedValue(null)

    const prepared = await run(stored)

    expect(prepared).toEqual({ status: 'failed' })
    expect(mocks.deletePdfObject).toHaveBeenCalledWith('pdf-new')
  })

  test('a refused commit drops only the new object', async () => {
    const prepared = await run(stored)
    await prepared.onRefused()

    expect(mocks.deletePdfObject).toHaveBeenCalledExactlyOnceWith('pdf-new')
  })
})
