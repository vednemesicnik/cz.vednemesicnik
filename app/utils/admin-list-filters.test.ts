import { describe, expect, test } from 'vitest'

import {
  type AdminListTableKey,
  extractAdminListFilterSearch,
  getPreservedFilterParams,
  parseAdminListFilters,
} from '~/utils/admin-list-filters'

const parse = (search: string, tableKey: AdminListTableKey) =>
  parseAdminListFilters(
    new Request(`https://x/administration/articles${search}`),
    tableKey,
  )

describe('parseAdminListFilters', () => {
  test('should parse all four articles filters', () => {
    expect(
      parse(
        '?state=draft&category=rozhovory&tag=skola&author=abc123',
        'articles',
      ),
    ).toEqual({
      author: 'abc123',
      category: 'rozhovory',
      state: 'draft',
      tag: 'skola',
    })
  })

  test('should parse the role filter for users and authors', () => {
    expect(parse('?role=administrator', 'users')).toEqual({
      role: 'administrator',
    })
    expect(parse('?role=coordinator', 'authors')).toEqual({
      role: 'coordinator',
    })
  })

  test('should parse the state filter for the remaining content tables', () => {
    expect(parse('?state=published', 'archive')).toEqual({
      state: 'published',
    })
    expect(parse('?state=archived', 'podcast_episodes')).toEqual({
      state: 'archived',
    })
  })

  test('should return an empty object when no filter params are present', () => {
    expect(parse('', 'articles')).toEqual({})
  })

  test('should drop an invalid state without discarding its siblings', () => {
    expect(parse('?state=sideways&category=rozhovory', 'articles')).toEqual({
      category: 'rozhovory',
    })
  })

  test('should drop empty values', () => {
    expect(parse('?state=&category=&tag=skola', 'articles')).toEqual({
      tag: 'skola',
    })
  })

  test('should ignore params outside the table schema', () => {
    expect(parse('?q=foo&sort=title&order=asc&page=2', 'articles')).toEqual({})
    expect(parse('?category=rozhovory', 'users')).toEqual({})
  })
})

describe('extractAdminListFilterSearch', () => {
  test('should keep only the filter params', () => {
    expect(
      extractAdminListFilterSearch('?state=draft&q=foo&page=2', 'articles'),
    ).toBe('state=draft')
  })

  test('should serialize in schema key order regardless of input order', () => {
    expect(
      extractAdminListFilterSearch(
        '?tag=skola&state=draft&author=abc123',
        'articles',
      ),
    ).toBe('author=abc123&state=draft&tag=skola')
  })

  test('should accept a search string without the leading question mark', () => {
    expect(extractAdminListFilterSearch('state=draft', 'articles')).toBe(
      'state=draft',
    )
  })

  test('should drop invalid and empty values', () => {
    expect(
      extractAdminListFilterSearch('?state=sideways&category=', 'articles'),
    ).toBe('')
  })

  test('should return an empty string when nothing is valid', () => {
    expect(extractAdminListFilterSearch('', 'articles')).toBe('')
    expect(extractAdminListFilterSearch('?q=foo&sort=title', 'users')).toBe('')
  })
})

describe('getPreservedFilterParams', () => {
  const preserved = (search: string, tableKey: AdminListTableKey) =>
    getPreservedFilterParams(new URLSearchParams(search), tableKey)

  test('should keep search and sort params', () => {
    expect(preserved('?q=foo&sort=title&order=asc', 'articles')).toEqual([
      ['q', 'foo'],
      ['sort', 'title'],
      ['order', 'asc'],
    ])
  })

  test('should drop the table filter params', () => {
    expect(
      preserved('?q=foo&state=draft&category=rozhovory', 'articles'),
    ).toEqual([['q', 'foo']])
  })

  test('should always drop the page param', () => {
    expect(preserved('?q=foo&page=4', 'articles')).toEqual([['q', 'foo']])
  })

  test('should keep params that are filters of a different table', () => {
    expect(preserved('?category=rozhovory', 'users')).toEqual([
      ['category', 'rozhovory'],
    ])
  })

  test('should return an empty array when nothing is preserved', () => {
    expect(preserved('?state=draft&page=2', 'articles')).toEqual([])
  })
})
