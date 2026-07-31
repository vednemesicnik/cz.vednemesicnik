import { isRouteErrorResponse } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { resolveDefaultFilter } from './resolve-default-filter.server'

const { findFirstMock } = vi.hoisted(() => ({ findFirstMock: vi.fn() }))

vi.mock('~/utils/db.server', () => ({
  prisma: { filter: { findFirst: findFirstMock } },
}))

const USER_ID = 'user-1'

const resolve = (search: string) =>
  resolveDefaultFilter({
    tableKey: 'articles',
    url: new URL(`https://x/administration/articles${search}`),
    userId: USER_ID,
  })

// The helper signals "apply this preset" by throwing a redirect Response.
const catchRedirect = async (search: string) => {
  try {
    await resolve(search)
  } catch (error) {
    if (isRouteErrorResponse(error) || error instanceof Response) {
      return error as Response
    }

    throw error
  }

  return null
}

describe('resolveDefaultFilter', () => {
  beforeEach(() => {
    findFirstMock.mockReset()
  })

  test('should redirect a bare visit to the default preset', async () => {
    findFirstMock.mockResolvedValue({ id: 'filter-1', query: 'state=draft' })

    const response = await catchRedirect('')

    expect(response?.status).toBe(302)
    expect(response?.headers.get('Location')).toBe(
      '/administration/articles?state=draft&filter=filter-1',
    )
  })

  test('should look the preset up for the viewer and the table only', async () => {
    findFirstMock.mockResolvedValue(null)

    await resolve('')

    expect(findFirstMock).toHaveBeenCalledWith({
      select: { id: true, query: true },
      where: { isDefault: true, tableKey: 'articles', userId: USER_ID },
    })
  })

  test.each([
    ['?state=published'],
    ['?q=foo'],
    ['?sort=title'],
    ['?page=2'],
    ['?filter=none'],
    ['?filter=filter-2'],
  ])('should not query or redirect for %s', async (search) => {
    findFirstMock.mockResolvedValue({ id: 'filter-1', query: 'state=draft' })

    expect(await catchRedirect(search)).toBeNull()
    expect(findFirstMock).not.toHaveBeenCalled()
  })

  test('should not redirect when the user has no default preset', async () => {
    findFirstMock.mockResolvedValue(null)

    expect(await catchRedirect('')).toBeNull()
  })

  test('should not redirect when the stored query no longer validates', async () => {
    findFirstMock.mockResolvedValue({ id: 'filter-1', query: 'state=sideways' })

    expect(await catchRedirect('')).toBeNull()
  })

  test('should canonicalize the stored query', async () => {
    findFirstMock.mockResolvedValue({
      id: 'filter-1',
      query: 'tag=skola&q=foo&state=draft',
    })

    const response = await catchRedirect('')

    expect(response?.headers.get('Location')).toBe(
      '/administration/articles?state=draft&tag=skola&filter=filter-1',
    )
  })
})
