import { describe, expect, test } from 'vitest'

import {
  buildSortSearch,
  parseAdminListParams,
} from '~/utils/admin-list-params'

const sortKeys = ['title', 'createdAt'] as const

const parse = (search: string) =>
  parseAdminListParams(new Request(`https://x/admin/articles${search}`), {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys,
  })

describe('parseAdminListParams', () => {
  test('should pass through a valid sort and order', () => {
    expect(parse('?sort=title&order=asc')).toMatchObject({
      order: 'asc',
      sort: 'title',
    })
  })

  test('should fall back to defaultSort for an unknown sort', () => {
    expect(parse('?sort=bogus').sort).toBe('createdAt')
  })

  test('should fall back to defaultSort when sort is absent', () => {
    expect(parse('').sort).toBe('createdAt')
  })

  test('should fall back to defaultOrder for an invalid order', () => {
    expect(parse('?order=sideways').order).toBe('desc')
  })

  test('should fall back to "asc" when defaultOrder is not provided', () => {
    const result = parseAdminListParams(
      new Request('https://x/admin/articles'),
      {
        defaultSort: 'createdAt',
        sortKeys,
      },
    )
    expect(result.order).toBe('asc')
  })

  test('should trim the q value', () => {
    expect(parse('?q=%20%20hello%20%20').query).toBe('hello')
  })

  test('should default q to an empty string when absent', () => {
    expect(parse('').query).toBe('')
  })

  test('should clamp page: missing -> 1', () => {
    expect(parse('').page).toBe(1)
  })

  test('should clamp page: zero -> 1', () => {
    expect(parse('?page=0').page).toBe(1)
  })

  test('should clamp page: negative -> 1', () => {
    expect(parse('?page=-5').page).toBe(1)
  })

  test('should clamp page: non-numeric -> 1', () => {
    expect(parse('?page=abc').page).toBe(1)
  })

  test('should keep a valid page', () => {
    expect(parse('?page=3').page).toBe(3)
  })
})

describe('buildSortSearch', () => {
  // Toggle cycle for a key: inactive -> asc -> desc -> cleared (back to default).

  test('inactive key -> sort=key&order=asc', () => {
    expect(buildSortSearch('', 'title')).toBe('?sort=title&order=asc')
  })

  test('active asc -> flips to desc', () => {
    expect(buildSortSearch('?sort=title&order=asc', 'title')).toBe(
      '?sort=title&order=desc',
    )
  })

  test('active desc -> clears sort and order (back to default)', () => {
    expect(buildSortSearch('?sort=title&order=desc', 'title')).toBe('')
  })

  test('active key with missing order -> advances to desc', () => {
    expect(buildSortSearch('?sort=title', 'title')).toBe(
      '?sort=title&order=desc',
    )
  })

  test('switching to a different key resets to asc', () => {
    expect(buildSortSearch('?sort=title&order=desc', 'createdAt')).toBe(
      '?sort=createdAt&order=asc',
    )
  })

  test('preserves an existing q param', () => {
    expect(buildSortSearch('?q=foo', 'title')).toBe(
      '?q=foo&sort=title&order=asc',
    )
  })

  test('always deletes the page param', () => {
    expect(buildSortSearch('?q=foo&page=4', 'title')).toBe(
      '?q=foo&sort=title&order=asc',
    )
  })

  test('returns an empty string (no leading ?) when no params remain', () => {
    expect(buildSortSearch('?sort=title&order=desc&page=2', 'title')).toBe('')
  })
})
