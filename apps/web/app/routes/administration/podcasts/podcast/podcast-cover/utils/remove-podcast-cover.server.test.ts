import { beforeEach, describe, expect, test, vi } from 'vitest'

import { removePodcastCover } from './remove-podcast-cover.server'
import type { CoverChangePodcast } from './save-podcast-cover-change.server'

const mocks = vi.hoisted(() => ({
  coverDelete: vi.fn(),
  deleteImage: vi.fn(),
  savePodcastCoverChange: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { podcastCover: { delete: mocks.coverDelete } },
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteImage: mocks.deleteImage,
}))

vi.mock('./save-podcast-cover-change.server', () => ({
  savePodcastCoverChange: mocks.savePodcastCoverChange,
}))

const request = new Request('https://test.local/')

const podcast: CoverChangePodcast = {
  cover: { id: 'cover-1' },
  state: 'draft',
  title: 'Přestávka',
}

const target = { podcastId: 'podcast-1', tabId: 'tab-1' }

const run = async (stored: Partial<CoverChangePodcast> = {}) => {
  await removePodcastCover(request, target)
  const { prepare } = mocks.savePodcastCoverChange.mock.lastCall?.[1] ?? {}
  return prepare({ ...podcast, ...stored })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.savePodcastCoverChange.mockResolvedValue({ status: 'saved' })
  mocks.coverDelete.mockReturnValue('delete-cover')
  mocks.deleteImage.mockResolvedValue(undefined)
})

describe('removePodcastCover', () => {
  test('lands without the hold, as a cancelled upload’s removal after Zavřít (0029)', async () => {
    await run()

    const options = mocks.savePodcastCoverChange.mock.lastCall?.[1]
    expect(options).toMatchObject({ ...target, landsWithoutHold: true })
    expect(options.isCancellable).toBeUndefined()
  })

  test('deletes the row, and its files only once it committed', async () => {
    const prepared = await run()

    expect(mocks.coverDelete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: 'cover-1' },
    })
    expect(prepared.writes).toEqual(['delete-cover'])
    expect(mocks.deleteImage).not.toHaveBeenCalled()

    await prepared.onCommitted()
    expect(mocks.deleteImage).toHaveBeenCalledWith('cover-1')
  })

  test('a cover that never landed counts as removed', async () => {
    expect(await run({ cover: null })).toEqual({ writes: [] })
    expect(mocks.coverDelete).not.toHaveBeenCalled()
  })
})
