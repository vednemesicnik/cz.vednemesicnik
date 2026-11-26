import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createDraftEpisode } from './create-draft-episode.server'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  deleteStaleEmptyEpisodeDrafts: vi.fn(),
  getAuthorPermissionContext: vi.fn(),
  getNextFreeEpisodeNumber: vi.fn(),
  podcastFindUnique: vi.fn(),
  requireAuthorPermission: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    podcast: { findUnique: mocks.podcastFindUnique },
    podcastEpisode: { create: mocks.create },
  },
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

vi.mock('../../utils/get-next-free-episode-number.server', () => ({
  getNextFreeEpisodeNumber: mocks.getNextFreeEpisodeNumber,
}))

vi.mock('./delete-stale-empty-episode-drafts.server', () => ({
  deleteStaleEmptyEpisodeDrafts: mocks.deleteStaleEmptyEpisodeDrafts,
}))

const request = new Request('https://test.local/')
const context = { authorId: 'author-1', can: vi.fn() }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireAuthorPermission.mockReset()
  mocks.getAuthorPermissionContext.mockResolvedValue(context)
  context.can.mockReturnValue({ hasPermission: true })
  mocks.podcastFindUnique.mockResolvedValue({
    authorId: 'author-2',
    firstContentAt: new Date('2026-10-01T10:00:00Z'),
    state: 'published',
  })
  mocks.getNextFreeEpisodeNumber.mockResolvedValue(14)
  mocks.create.mockResolvedValue({ id: 'draft-1' })
  mocks.deleteStaleEmptyEpisodeDrafts.mockResolvedValue(0)
})

describe('createDraftEpisode', () => {
  test('creates a draft in the podcast with the next free number', async () => {
    expect(await createDraftEpisode(request, 'podcast-1')).toEqual({
      episodeId: 'draft-1',
    })

    expect(mocks.requireAuthorPermission).toHaveBeenCalledWith(context, {
      action: 'create',
      entity: 'podcast_episode',
      state: 'draft',
      targetAuthorIds: ['author-1'],
    })
    expect(mocks.getNextFreeEpisodeNumber).toHaveBeenCalledWith({
      podcastId: 'podcast-1',
    })
    expect(mocks.create).toHaveBeenCalledWith({
      data: { authorId: 'author-1', number: 14, podcastId: 'podcast-1' },
      select: { id: true },
    })
  })

  test('clears the empty drafts left over before it creates one', async () => {
    await createDraftEpisode(request, 'podcast-1')

    expect(
      mocks.deleteStaleEmptyEpisodeDrafts.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.create.mock.invocationCallOrder[0])
  })

  test('still opens the draft when the clean-up fails', async () => {
    mocks.deleteStaleEmptyEpisodeDrafts.mockRejectedValue(
      new Error('database busy'),
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(await createDraftEpisode(request, 'podcast-1')).toEqual({
      episodeId: 'draft-1',
    })
    expect(consoleError).toHaveBeenCalled()
  })

  test('creates nothing in a podcast that is gone', async () => {
    mocks.podcastFindUnique.mockResolvedValue(null)

    await expect(
      createDraftEpisode(request, 'podcast-1'),
    ).rejects.toMatchObject({ init: { status: 404 } })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  test('creates nothing in an empty podcast draft (log 0020)', async () => {
    mocks.podcastFindUnique.mockResolvedValue({
      authorId: 'author-1',
      firstContentAt: null,
      state: 'draft',
    })

    await expect(
      createDraftEpisode(request, 'podcast-1'),
    ).rejects.toMatchObject({ init: { status: 404 } })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  test('creates nothing in a podcast the author may not see', async () => {
    context.can.mockReturnValue({ hasPermission: false })

    await expect(
      createDraftEpisode(request, 'podcast-1'),
    ).rejects.toMatchObject({ init: { status: 404 } })
    expect(context.can).toHaveBeenCalledWith({
      action: 'view',
      entity: 'podcast',
      state: 'published',
      targetAuthorIds: ['author-2'],
    })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  test('creates nothing for an author who may not create episodes', async () => {
    mocks.requireAuthorPermission.mockImplementation(() => {
      throw data(null, { status: 403 })
    })

    await expect(
      createDraftEpisode(request, 'podcast-1'),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
