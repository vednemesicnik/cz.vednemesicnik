import { beforeEach, describe, expect, test, vi } from 'vitest'

import { removeEpisodeCover } from './remove-episode-cover.server'
import type { CoverChangeEpisode } from './save-episode-cover-change.server'

const mocks = vi.hoisted(() => ({
  coverDelete: vi.fn(),
  deleteImage: vi.fn(),
  saveEpisodeCoverChange: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { podcastEpisodeCover: { delete: mocks.coverDelete } },
}))

vi.mock('~/utils/image-store/store-image.server', () => ({
  deleteImage: mocks.deleteImage,
}))

vi.mock('./save-episode-cover-change.server', () => ({
  saveEpisodeCoverChange: mocks.saveEpisodeCoverChange,
}))

const request = new Request('https://test.local/')

const episode: CoverChangeEpisode = {
  cover: { id: 'cover-1' },
  number: 14,
  state: 'draft',
  title: 'Školník, který ví všechno',
}

const target = {
  episodeId: 'episode-1',
  podcastId: 'podcast-1',
  tabId: 'tab-1',
}

const run = async (stored: Partial<CoverChangeEpisode> = {}) => {
  await removeEpisodeCover(request, target)
  const { prepare } = mocks.saveEpisodeCoverChange.mock.lastCall?.[1] ?? {}
  return prepare({ ...episode, ...stored })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.saveEpisodeCoverChange.mockResolvedValue({ status: 'saved' })
  mocks.coverDelete.mockReturnValue('delete-cover')
  mocks.deleteImage.mockResolvedValue(undefined)
})

describe('removeEpisodeCover', () => {
  test('lands without the hold, as a cancelled upload’s removal after Zavřít (0029)', async () => {
    await run()

    const options = mocks.saveEpisodeCoverChange.mock.lastCall?.[1]
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
    expect(prepared.isUpload).toBeUndefined()
    expect(mocks.deleteImage).not.toHaveBeenCalled()

    await prepared.onCommitted()
    expect(mocks.deleteImage).toHaveBeenCalledWith('cover-1')
  })

  test('a cover already gone counts as removed', async () => {
    expect(await run({ cover: null })).toEqual({ writes: [] })
    expect(mocks.coverDelete).not.toHaveBeenCalled()
  })
})
