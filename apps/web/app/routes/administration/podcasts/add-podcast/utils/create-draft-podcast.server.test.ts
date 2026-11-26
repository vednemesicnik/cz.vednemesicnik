import { data } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createDraftPodcast } from './create-draft-podcast.server'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  deleteStaleEmptyPodcastDrafts: vi.fn(),
  getAuthorPermissionContext: vi.fn(),
  requireAuthorPermission: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { podcast: { create: mocks.create } },
}))

vi.mock(
  '~/utils/permissions/author/context/get-author-permission-context.server',
  () => ({ getAuthorPermissionContext: mocks.getAuthorPermissionContext }),
)

vi.mock(
  '~/utils/permissions/author/guards/require-author-permission.server',
  () => ({ requireAuthorPermission: mocks.requireAuthorPermission }),
)

vi.mock('./delete-stale-empty-podcast-drafts.server', () => ({
  deleteStaleEmptyPodcastDrafts: mocks.deleteStaleEmptyPodcastDrafts,
}))

const request = new Request('https://test.local/')
const context = { authorId: 'author-1' }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireAuthorPermission.mockReset()
  mocks.getAuthorPermissionContext.mockResolvedValue(context)
  mocks.create.mockResolvedValue({ id: 'draft-1' })
  mocks.deleteStaleEmptyPodcastDrafts.mockResolvedValue(0)
})

describe('createDraftPodcast', () => {
  test('creates an empty draft owned by the signed-in author', async () => {
    expect(await createDraftPodcast(request)).toEqual({ podcastId: 'draft-1' })

    expect(mocks.requireAuthorPermission).toHaveBeenCalledWith(context, {
      action: 'create',
      entity: 'podcast',
      state: 'draft',
      targetAuthorIds: ['author-1'],
    })
    expect(mocks.create).toHaveBeenCalledWith({
      data: { authorId: 'author-1' },
      select: { id: true },
    })
  })

  test('clears the empty drafts left over before it creates one', async () => {
    await createDraftPodcast(request)

    expect(
      mocks.deleteStaleEmptyPodcastDrafts.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.create.mock.invocationCallOrder[0])
  })

  test('still opens the draft when the clean-up fails', async () => {
    mocks.deleteStaleEmptyPodcastDrafts.mockRejectedValue(
      new Error('database busy'),
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(await createDraftPodcast(request)).toEqual({ podcastId: 'draft-1' })
    expect(consoleError).toHaveBeenCalled()
  })

  test('creates nothing for an author who may not create podcasts', async () => {
    mocks.requireAuthorPermission.mockImplementation(() => {
      throw data(null, { status: 403 })
    })

    await expect(createDraftPodcast(request)).rejects.toMatchObject({
      init: { status: 403 },
    })
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
