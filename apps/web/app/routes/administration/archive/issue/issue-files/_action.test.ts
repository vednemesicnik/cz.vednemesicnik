import { beforeEach, describe, expect, test, vi } from 'vitest'

import { action } from './_action'

const mocks = vi.hoisted(() => ({
  removeIssueFile: vi.fn(),
  requireCSRF: vi.fn(),
  uploadIssueCover: vi.fn(),
  uploadIssuePdf: vi.fn(),
}))

vi.mock('~/utils/csrf.server', () => ({ requireCSRF: mocks.requireCSRF }))

vi.mock('./utils/remove-issue-file.server', () => ({
  removeIssueFile: mocks.removeIssueFile,
}))

vi.mock('./utils/upload-issue-cover.server', () => ({
  uploadIssueCover: mocks.uploadIssueCover,
}))

vi.mock('./utils/upload-issue-pdf.server', () => ({
  uploadIssuePdf: mocks.uploadIssuePdf,
}))

const URL = 'https://test.local/administration/archive/issue-1/files'

const buildRequest = (fields: Array<[string, string | File]>) => {
  const formData = new FormData()
  for (const [name, value] of fields) {
    formData.append(name, value)
  }
  return new Request(URL, { body: formData, method: 'POST' })
}

const callAction = (request: Request) =>
  action({
    context: {},
    params: { issueId: 'issue-1' },
    request,
  } as unknown as Parameters<typeof action>[0])

const cover = () => new File(['bytes'], 'obalka.jpg', { type: 'image/jpeg' })
const pdf = () => new File(['%PDF'], 'podzim.pdf', { type: 'application/pdf' })

const target = { issueId: 'issue-1', tabId: 'tab-1' }

beforeEach(() => {
  vi.clearAllMocks()
  const saved = { status: 'saved', updatedAt: new Date('2026-10-20T12:00:00Z') }
  mocks.uploadIssueCover.mockResolvedValue(saved)
  mocks.uploadIssuePdf.mockResolvedValue(saved)
  mocks.removeIssueFile.mockResolvedValue(saved)
})

describe('issue-files action — the input', () => {
  test('requires the session before any change', async () => {
    mocks.requireCSRF.mockRejectedValueOnce(new Response(null, { status: 403 }))

    await expect(
      callAction(
        buildRequest([
          ['intent', 'remove'],
          ['kind', 'pdf'],
          ['editTabId', 'tab-1'],
        ]),
      ),
    ).rejects.toBeInstanceOf(Response)

    expect(mocks.removeIssueFile).not.toHaveBeenCalled()
  })

  test.each([
    [
      'an unknown kind',
      [
        ['intent', 'remove'],
        ['kind', 'poster'],
        ['editTabId', 'tab-1'],
      ],
    ],
    [
      'a missing editor tab',
      [
        ['intent', 'remove'],
        ['kind', 'pdf'],
      ],
    ],
    [
      'an upload without a file',
      [
        ['intent', 'upload'],
        ['kind', 'pdf'],
        ['editTabId', 'tab-1'],
      ],
    ],
  ] as Array<[string, Array<[string, string]>]>)(
    'answers 400 invalid for %s',
    async (_name, fields) => {
      const response = await callAction(buildRequest(fields))

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ status: 'invalid' })
    },
  )
})

describe('issue-files action — the changes', () => {
  test('uploads a cover', async () => {
    const response = await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['kind', 'cover'],
        ['editTabId', 'tab-1'],
        ['file', cover()],
      ]),
    )

    expect(response.status).toBe(200)
    expect(mocks.uploadIssueCover).toHaveBeenCalledWith(expect.any(Request), {
      ...target,
      file: expect.any(File),
    })
    expect(mocks.uploadIssuePdf).not.toHaveBeenCalled()
  })

  test('uploads a PDF', async () => {
    await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['kind', 'pdf'],
        ['editTabId', 'tab-1'],
        ['file', pdf()],
      ]),
    )

    expect(mocks.uploadIssuePdf).toHaveBeenCalledWith(expect.any(Request), {
      ...target,
      file: expect.any(File),
    })
  })

  test('removes a file by its kind', async () => {
    await callAction(
      buildRequest([
        ['intent', 'remove'],
        ['kind', 'cover'],
        ['editTabId', 'tab-1'],
      ]),
    )

    expect(mocks.removeIssueFile).toHaveBeenCalledWith(expect.any(Request), {
      ...target,
      kind: 'cover',
    })
  })

  test.each([
    [{ heldByName: 'Ondřej Beneš', status: 'not-held' }, 409],
    [{ reason: 'over-pixel-budget', status: 'failed' }, 422],
    [{ status: 'cancelled' }, 499],
  ])('answers %o with %i', async (result, status) => {
    mocks.uploadIssueCover.mockResolvedValue(result)

    const response = await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['kind', 'cover'],
        ['editTabId', 'tab-1'],
        ['file', cover()],
      ]),
    )

    expect(response.status).toBe(status)
    expect(await response.json()).toEqual(result)
  })
})

describe('issue-files action — a cancelled body (bxy8xxqs)', () => {
  const buildBrokenRequest = (isAborted: boolean) => {
    const controller = new AbortController()
    const body = new ReadableStream({
      start: (streamController) => streamController.error(new Error('gone')),
    })
    const request = new Request(URL, {
      body,
      duplex: 'half',
      headers: { 'Content-Type': 'multipart/form-data; boundary=boundary' },
      method: 'POST',
      signal: controller.signal,
    } as RequestInit)
    if (isAborted) controller.abort()
    return request
  }

  test('answers 499 and runs nothing when the editor cancelled mid-body', async () => {
    const response = await callAction(buildBrokenRequest(true))

    expect(response.status).toBe(499)
    expect(mocks.requireCSRF).not.toHaveBeenCalled()
    expect(mocks.uploadIssuePdf).not.toHaveBeenCalled()
  })

  test('lets a body that broke for another reason through', async () => {
    await expect(callAction(buildBrokenRequest(false))).rejects.toThrow()
  })
})
