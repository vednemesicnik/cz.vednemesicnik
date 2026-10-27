import { beforeEach, describe, expect, test, vi } from 'vitest'

import { action } from './_action'

const mocks = vi.hoisted(() => ({
  removeEpisodeCover: vi.fn(),
  requireCSRF: vi.fn(),
  uploadEpisodeCover: vi.fn(),
}))

vi.mock('~/utils/csrf.server', () => ({ requireCSRF: mocks.requireCSRF }))

vi.mock('./utils/remove-episode-cover.server', () => ({
  removeEpisodeCover: mocks.removeEpisodeCover,
}))

vi.mock('./utils/upload-episode-cover.server', () => ({
  uploadEpisodeCover: mocks.uploadEpisodeCover,
}))

const URL =
  'https://test.local/administration/podcasts/podcast-1/episodes/episode-1/cover'

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
    params: { episodeId: 'episode-1', podcastId: 'podcast-1' },
    request,
  } as unknown as Parameters<typeof action>[0])

const cover = () => new File(['bytes'], 'obalka.jpg', { type: 'image/jpeg' })

const target = {
  episodeId: 'episode-1',
  podcastId: 'podcast-1',
  tabId: 'tab-1',
}

beforeEach(() => {
  vi.clearAllMocks()
  const saved = { status: 'saved', updatedAt: new Date('2026-10-27T12:00:00Z') }
  mocks.uploadEpisodeCover.mockResolvedValue(saved)
  mocks.removeEpisodeCover.mockResolvedValue(saved)
})

describe('episode-cover action — the input', () => {
  test('requires the session before any change', async () => {
    mocks.requireCSRF.mockRejectedValueOnce(new Response(null, { status: 403 }))

    await expect(
      callAction(
        buildRequest([
          ['intent', 'remove'],
          ['editTabId', 'tab-1'],
        ]),
      ),
    ).rejects.toBeInstanceOf(Response)

    expect(mocks.removeEpisodeCover).not.toHaveBeenCalled()
  })

  test.each([
    ['a missing editor tab', [['intent', 'remove']]],
    [
      'an upload without a file',
      [
        ['intent', 'upload'],
        ['editTabId', 'tab-1'],
      ],
    ],
    [
      'an unknown intent',
      [
        ['intent', 'rotate'],
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

describe('episode-cover action — the changes', () => {
  test('uploads a cover', async () => {
    const response = await callAction(
      buildRequest([
        ['intent', 'upload'],
        ['editTabId', 'tab-1'],
        ['file', cover()],
      ]),
    )

    expect(response.status).toBe(200)
    expect(mocks.uploadEpisodeCover).toHaveBeenCalledWith(expect.any(Request), {
      ...target,
      file: expect.any(File),
    })
    expect(mocks.removeEpisodeCover).not.toHaveBeenCalled()
  })

  test('removes the cover for the podcast’s', async () => {
    await callAction(
      buildRequest([
        ['intent', 'remove'],
        ['editTabId', 'tab-1'],
      ]),
    )

    expect(mocks.removeEpisodeCover).toHaveBeenCalledWith(
      expect.any(Request),
      target,
    )
  })

  test.each([
    [{ heldByName: 'Ondřej Beneš', status: 'not-held' }, 409],
    [{ status: 'deleted' }, 410],
    [{ reason: 'over-pixel-budget', status: 'failed' }, 422],
  ])('answers %o with %i', async (result, status) => {
    mocks.uploadEpisodeCover.mockResolvedValue(result)

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
