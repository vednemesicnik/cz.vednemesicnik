import { describe, expect, test } from 'vitest'

import {
  type AdminListTableKey,
  buildStaleFilterRedirect,
  extractAdminListFilterSearch,
  getPreservedFilterParams,
  hasAdminListParams,
  parseAdminListFilters,
  validateFilterQuery,
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

  test('should ignore the preset marker', () => {
    expect(
      extractAdminListFilterSearch('?state=draft&filter=abc123', 'articles'),
    ).toBe('state=draft')
    expect(extractAdminListFilterSearch('?filter=none', 'articles')).toBe('')
  })
})

describe('validateFilterQuery', () => {
  test('should return the canonical form of a valid query', () => {
    expect(validateFilterQuery('?tag=skola&state=draft', 'articles')).toBe(
      'state=draft&tag=skola',
    )
  })

  test('should keep the valid params of a partially valid query', () => {
    expect(validateFilterQuery('?state=sideways&tag=skola', 'articles')).toBe(
      'tag=skola',
    )
  })

  test('should drop params that are not filters of the table', () => {
    expect(
      validateFilterQuery('?q=foo&sort=title&page=2&state=draft', 'articles'),
    ).toBe('state=draft')
  })

  test('should return null when nothing valid remains', () => {
    expect(validateFilterQuery('', 'articles')).toBe(null)
    expect(validateFilterQuery('?state=&category=', 'articles')).toBe(null)
    expect(validateFilterQuery('?q=foo&page=2', 'articles')).toBe(null)
    expect(validateFilterQuery('?category=rozhovory', 'users')).toBe(null)
  })

  test('should return null for a table key that is no longer in the registry', () => {
    expect(
      validateFilterQuery('?state=draft', 'retired_table' as AdminListTableKey),
    ).toBe(null)
  })

  test('should return null for a prototype key rather than throwing', () => {
    expect(
      validateFilterQuery('?state=draft', 'constructor' as AdminListTableKey),
    ).toBe(null)
  })
})

describe('buildStaleFilterRedirect', () => {
  const categoryOptions = [{ value: 'rozhovory' }, { value: 'skola' }]

  const redirectFor = (search: string) =>
    buildStaleFilterRedirect(
      new URL(`https://x/administration/articles${search}`),
      { category: categoryOptions },
    )

  test('should return null when the value is still offered', () => {
    expect(redirectFor('?category=rozhovory')).toBe(null)
  })

  test('should return null when the param is absent or empty', () => {
    expect(redirectFor('')).toBe(null)
    expect(redirectFor('?category=')).toBe(null)
  })

  test('should strip a value that is no longer offered', () => {
    expect(redirectFor('?category=zaniklo')).toBe('/administration/articles')
  })

  test('should keep the remaining params and drop the page', () => {
    expect(redirectFor('?q=foo&category=zaniklo&state=draft&page=3')).toBe(
      '/administration/articles?q=foo&state=draft',
    )
  })

  test('should strip every stale param at once', () => {
    expect(
      buildStaleFilterRedirect(
        new URL('https://x/administration/articles?category=zaniklo&tag=pryc'),
        { category: categoryOptions, tag: [{ value: 'skola' }] },
      ),
    ).toBe('/administration/articles')
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

  test('should degrade the preset marker to none', () => {
    expect(preserved('?state=draft&filter=abc123', 'articles')).toEqual([
      ['filter', 'none'],
    ])
  })

  test('should not add a preset marker when there is none', () => {
    expect(preserved('?state=draft&q=foo', 'articles')).toEqual([['q', 'foo']])
  })
})

describe('hasAdminListParams', () => {
  const hasParams = (search: string, tableKey: AdminListTableKey) =>
    hasAdminListParams(new URLSearchParams(search), tableKey)

  test.each([
    ['?state=draft'],
    ['?q=foo'],
    ['?sort=title'],
    ['?order=asc'],
    ['?page=2'],
    ['?filter=abc123'],
    ['?filter=none'],
  ])('should detect list state in %s', (search) => {
    expect(hasParams(search, 'articles')).toBe(true)
  })

  test('should return false for a bare URL', () => {
    expect(hasParams('', 'articles')).toBe(false)
  })

  test('should ignore a filter param of a different table', () => {
    expect(hasParams('?category=rozhovory', 'users')).toBe(false)
  })

  test('should detect an empty value as list state', () => {
    // `?state=` is what an explicitly cleared select submits — still explicit.
    expect(hasParams('?state=', 'articles')).toBe(true)
  })
})
