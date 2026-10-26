import { beforeEach, describe, expect, test, vi } from 'vitest'

import { loadMissingEpisodeLinkItems } from './load-missing-episode-link-items.server'

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    podcastEpisodeLink: {
      count: mocks.count,
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('loadMissingEpisodeLinkItems', () => {
  test('says the link is missing when the episode has none', async () => {
    mocks.count.mockResolvedValue(0)

    expect(await loadMissingEpisodeLinkItems('e1')).toEqual([
      'Chybí odkaz na epizodu.',
    ])
  })

  test('says nothing when the episode has a link', async () => {
    mocks.count.mockResolvedValue(1)

    expect(await loadMissingEpisodeLinkItems('e1')).toEqual([])
  })

  test('counts only the links of the episode', async () => {
    mocks.count.mockResolvedValue(0)

    await loadMissingEpisodeLinkItems('e1')

    expect(mocks.count).toHaveBeenCalledWith({ where: { episodeId: 'e1' } })
  })
})
