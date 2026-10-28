import { beforeEach, describe, expect, test, vi } from 'vitest'

import { action } from './_action'

const mocks = vi.hoisted(() => ({
  requireCSRF: vi.fn(),
  uploadPodcastCover: vi.fn(),
}))

vi.mock('~/utils/csrf.server', () => ({ requireCSRF: mocks.requireCSRF }))

vi.mock('./utils/upload-podcast-cover.server', () => ({
  uploadPodcastCover: mocks.uploadPodcastCover,
}))

const URL = 'https://test.local/administration/podcasts/podcast-1/cover'

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
    params: { podcastId: 'podcast-1' },
    request,
  } as unknown as Parameters<typeof action>[0])

const cover = () => new File(['bytes'], 'obalka.jpg', { type: 'image/jpeg' })

beforeEach(() => {
  vi.clearAllMocks()
  mocks.uploadPodcastCover.mockResolvedValue({
    status: 'saved',
    updatedAt: new Date('2026-10-28T12:00:00Z'),
  })
})

describe('podcast-cover action — the input', () => {
  test('requires the session before any change', async () => {
    mocks.requireCSRF.mockRejectedValueOnce(new Response(null, { status: 403 }))

    await expect(
      callAction(
        buildRequest([
          ['intent', 'upload'],
          ['editTabId', 'tab-1'],
          ['file', cover()],
        ]),
      ),
    ).rejects.toBeInstanceOf(Response)

    expect(mocks.uploadPodcastCover).not.toHaveBeenCalled()
  })

  test.each([
    [
      'a missing editor tab',
      [
        ['intent', 'upload'],
        ['file', cover()],
      ],
    ],
    [
      'an upload without a file',
      [
        ['intent', 'upload'],
        ['editTabId', 'tab-1'],
      ],
    ],
    // A podcast needs a cover: it is replaced, never removed (27e).
    [
      'a removal',
      [
        ['intent', 'remove'],
        ['editTabId', 'tab-1'],
      ],
    ],
  ] as Array<[string, Array<[string, string | File]>]>)(
    'answers 400 invalid for %s',
    async (_name, fields) => {
      const response = await callAction(buildRequest(fields))

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ status: 'invalid' })
      expect(mocks.uploadPodcastCover).not.toHaveBeenCalled()
    },
  )
})

describe('podcast-cover action — the upload', () => {
  test('uploads the cover for the editor’s tab', async () => {
    const response = await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['editTabId', 'tab-1'],
        ['file', cover()],
      ]),
    )

    expect(response.status).toBe(200)
    expect(mocks.uploadPodcastCover).toHaveBeenCalledWith(expect.any(Request), {
      file: expect.any(File),
      podcastId: 'podcast-1',
      tabId: 'tab-1',
    })
  })

  test.each([
    [{ heldByName: 'Ondřej Beneš', status: 'not-held' }, 409],
    [{ status: 'deleted' }, 410],
    [{ reason: 'over-pixel-budget', status: 'failed' }, 422],
  ])('answers %o with %i', async (result, status) => {
    mocks.uploadPodcastCover.mockResolvedValue(result)

    const response = await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['editTabId', 'tab-1'],
        ['file', cover()],
      ]),
    )

    expect(response.status).toBe(status)
    expect(await response.json()).toEqual(result)
  })
})
