import { beforeEach, describe, expect, test, vi } from 'vitest'

import { loadSavedFilters } from './load-saved-filters.server'

const { findManyMock } = vi.hoisted(() => ({ findManyMock: vi.fn() }))

vi.mock('~/utils/db.server', () => ({
  prisma: { filter: { findMany: findManyMock } },
}))

const USER_ID = 'user-1'

const OWN_FILTER = {
  id: 'own-1',
  isDefault: true,
  isShared: false,
  name: 'Moje rozpracované',
  query: 'state=draft',
}

const SHARED_FILTER = {
  id: 'shared-1',
  name: 'Publikované',
  query: 'state=published',
  user: { name: 'Jana Nováková', username: 'jana' },
}

// The two queries resolve in the order the helper declares them: own presets first.
const mockFilters = (
  ownFilters: unknown[] = [OWN_FILTER],
  sharedFilters: unknown[] = [SHARED_FILTER],
) => {
  findManyMock
    .mockResolvedValueOnce(ownFilters)
    .mockResolvedValueOnce(sharedFilters)
}

const load = (search: string) =>
  loadSavedFilters({
    tableKey: 'articles',
    url: new URL(`https://x/administration/articles${search}`),
    userId: USER_ID,
  })

describe('loadSavedFilters', () => {
  beforeEach(() => {
    findManyMock.mockReset()
  })

  test('should scope the own presets to the viewer and the table', async () => {
    mockFilters()

    await load('')

    expect(findManyMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { tableKey: 'articles', userId: USER_ID },
      }),
    )
  })

  test('should load only shared presets owned by someone else', async () => {
    mockFilters()

    await load('')

    expect(findManyMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          isShared: true,
          NOT: { userId: USER_ID },
          tableKey: 'articles',
        },
      }),
    )
  })

  test('should label a shared preset with its owner name', async () => {
    mockFilters()

    const { sharedFilters } = await load('')

    expect(sharedFilters).toEqual([
      {
        id: 'shared-1',
        name: 'Publikované',
        ownerName: 'Jana Nováková',
        query: 'state=published',
      },
    ])
  })

  test('should fall back to the username when the owner has no name', async () => {
    mockFilters(
      [],
      [{ ...SHARED_FILTER, user: { name: null, username: 'jana' } }],
    )

    const { sharedFilters } = await load('')

    expect(sharedFilters[0]?.ownerName).toBe('jana')
  })

  test('should mark the requested preset as active', async () => {
    mockFilters()

    const { activeFilterId } = await load('?state=draft&filter=own-1')

    expect(activeFilterId).toBe('own-1')
  })

  test('should mark a shared preset as active', async () => {
    mockFilters()

    const { activeFilterId } = await load('?state=published&filter=shared-1')

    expect(activeFilterId).toBe('shared-1')
  })

  test('should ignore a preset the viewer cannot see', async () => {
    mockFilters()

    const { activeFilterId } = await load('?state=draft&filter=someone-elses')

    expect(activeFilterId).toBeNull()
  })

  test('should leave the menu unhighlighted without the preset marker', async () => {
    mockFilters()

    const { activeFilterId } = await load('?state=draft')

    expect(activeFilterId).toBeNull()
  })

  test('should snapshot only the canonical filter params', async () => {
    mockFilters()

    const { currentFilterQuery } = await load(
      '?tag=skola&q=foo&state=draft&page=2&filter=own-1',
    )

    expect(currentFilterQuery).toBe('state=draft&tag=skola')
  })

  test('should snapshot an empty query for an unfiltered list', async () => {
    mockFilters()

    const { currentFilterQuery } = await load('?q=foo&sort=title')

    expect(currentFilterQuery).toBe('')
  })
})
