import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { WebContentVisibility } from '~/utils/permissions/author/get-web-content-visibility.server'

import { findWebPodcast } from './find-web-podcast.server'

const mocks = vi.hoisted(() => ({ findFirst: vi.fn() }))

vi.mock('~/utils/db.server', () => ({
  prisma: { podcast: { findFirst: mocks.findFirst } },
}))

const VISIBLE = { OR: [{ state: 'published' }] }
const visibility = {
  where: vi.fn(() => VISIBLE),
} as unknown as WebContentVisibility

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findFirst.mockResolvedValue(null)
})

describe('findWebPodcast', () => {
  test('a reader gets the podcast that holds the address as published', async () => {
    mocks.findFirst.mockResolvedValueOnce({ id: 'p1' })

    expect(await findWebPodcast('prestavka', visibility)).toEqual({
      id: 'p1',
    })
    expect(mocks.findFirst).toHaveBeenCalledTimes(1)
    expect(mocks.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { publishedSlug: 'prestavka', state: 'published' },
    })
  })

  test('otherwise a visible, non-empty podcast under its typed address, the last edited first', async () => {
    mocks.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'p2',
    })

    expect(await findWebPodcast('prestavka', visibility)).toEqual({
      id: 'p2',
    })
    expect(mocks.findFirst).toHaveBeenLastCalledWith({
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
      where: {
        AND: [VISIBLE],
        firstContentAt: { not: null },
        slug: 'prestavka',
      },
    })
  })

  test('null when no podcast the visitor may see has the address', async () => {
    expect(await findWebPodcast('prestavka', visibility)).toBeNull()
  })
})
