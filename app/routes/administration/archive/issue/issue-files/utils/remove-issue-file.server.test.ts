import { beforeEach, describe, expect, test, vi } from 'vitest'

import { removeIssueFile } from './remove-issue-file.server'
import type { FileChangeIssue } from './save-issue-file-change.server'

const mocks = vi.hoisted(() => ({
  deleteImage: vi.fn(),
  deletePdfObject: vi.fn(),
  issueCoverDelete: vi.fn(),
  issuePdfDelete: vi.fn(),
  saveIssueFileChange: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    issueCover: { delete: mocks.issueCoverDelete },
    issuePDF: { delete: mocks.issuePdfDelete },
  },
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteImage: mocks.deleteImage,
}))

vi.mock('~/utils/pdf-store/store-pdf.server', () => ({
  deletePdfObject: mocks.deletePdfObject,
}))

vi.mock('./save-issue-file-change.server', () => ({
  saveIssueFileChange: mocks.saveIssueFileChange,
}))

const request = new Request('https://test.local/')

const issue: FileChangeIssue = {
  cover: { id: 'cover-1' },
  name: 'podzim',
  order: 4,
  pdf: { fileName: 'VDM-2026-4.pdf', id: 'pdf-1' },
  state: 'draft',
  supplement: null,
  supplementSlug: '',
  year: 2026,
}

const run = async (
  kind: 'cover' | 'pdf',
  stored: Partial<FileChangeIssue> = {},
) => {
  await removeIssueFile(request, { issueId: 'issue-1', kind, tabId: 'tab-1' })
  const { prepare } = mocks.saveIssueFileChange.mock.lastCall?.[1] ?? {}
  return prepare({ ...issue, ...stored })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.saveIssueFileChange.mockResolvedValue({ status: 'saved' })
  mocks.issueCoverDelete.mockReturnValue('delete-cover')
  mocks.issuePdfDelete.mockReturnValue('delete-pdf')
  mocks.deleteImage.mockResolvedValue(undefined)
  mocks.deletePdfObject.mockResolvedValue(undefined)
})

describe('removeIssueFile', () => {
  test('lands without the hold, like the upload it undoes', async () => {
    await run('pdf')

    expect(mocks.saveIssueFileChange).toHaveBeenCalledWith(
      request,
      expect.objectContaining({ issueId: 'issue-1', landsWithoutHold: true }),
    )
  })

  test('deletes the cover row, then its files after the commit', async () => {
    const prepared = await run('cover')

    expect(prepared.writes).toEqual(['delete-cover'])
    expect(mocks.deleteImage).not.toHaveBeenCalled()
    await prepared.onCommitted()
    expect(mocks.deleteImage).toHaveBeenCalledWith('cover-1')
    expect(prepared).not.toHaveProperty('logEvent')
  })

  test('deletes the PDF row, then its object after the commit', async () => {
    const prepared = await run('pdf')

    expect(prepared.writes).toEqual(['delete-pdf'])
    await prepared.onCommitted()
    expect(mocks.deletePdfObject).toHaveBeenCalledWith('pdf-1')
  })

  test.each([
    ['cover', { cover: null }],
    ['pdf', { pdf: null }],
  ] as const)(
    'a %s that never landed counts as removed',
    async (kind, stored) => {
      const prepared = await run(kind, stored)

      expect(prepared).toEqual({ writes: [] })
    },
  )
})
