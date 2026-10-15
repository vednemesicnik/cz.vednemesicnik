import { describe, expect, test } from 'vitest'

import {
  type AdminListTableKey,
  buildStaleFilterRedirect,
  extractAdminListFilterSearch,
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
      author: ['abc123'],
      category: ['rozhovory'],
      state: ['draft'],
      tag: ['skola'],
    })
  })

  test('should parse repeated articles params as several values', () => {
    expect(
      parse(
        '?state=draft&state=pending&category=skola&category=sport',
        'articles',
      ),
    ).toEqual({
      category: ['skola', 'sport'],
      state: ['draft', 'pending'],
    })
  })

  test('should drop one invalid value and keep its valid siblings', () => {
    expect(
      parse('?state=draft&state=sideways&state=pending', 'articles'),
    ).toEqual({ state: ['draft', 'pending'] })
  })

  test('should drop duplicate values', () => {
    expect(parse('?tag=skola&tag=skola', 'articles')).toEqual({
      tag: ['skola'],
    })
  })

  test('should parse the role and account filters of the authors', () => {
    expect(
      parse('?role=coordinator&role=creator&account=none', 'authors'),
    ).toEqual({ account: ['none'], role: ['coordinator', 'creator'] })
  })

  test('should drop a role that is not an author role or an unknown account', () => {
    // A user role is no author role.
    expect(parse('?role=administrator&account=maybe', 'authors')).toEqual({})
  })

  test('should parse the queues of the remaining content tables', () => {
    expect(parse('?state=pending&state=published', 'archive')).toEqual({
      state: ['pending', 'published'],
    })
    expect(parse('?state=archived', 'podcast_episodes')).toEqual({
      state: ['archived'],
    })
  })

  test('should parse several years of the archive', () => {
    expect(parse('?year=2025&year=2026&year=20x5', 'archive')).toEqual({
      year: ['2025', '2026'],
    })
  })

  test('should return an empty object when no filter params are present', () => {
    expect(parse('', 'articles')).toEqual({})
  })

  test('should drop an invalid state without discarding its siblings', () => {
    expect(parse('?state=sideways&category=rozhovory', 'articles')).toEqual({
      category: ['rozhovory'],
    })
  })

  test('should drop empty values', () => {
    expect(parse('?state=&category=&tag=skola', 'articles')).toEqual({
      tag: ['skola'],
    })
  })

  test('should ignore params outside the table schema', () => {
    expect(parse('?q=foo&sort=title&order=asc&page=2', 'articles')).toEqual({})
    expect(parse('?category=rozhovory', 'authors')).toEqual({})
  })
})

describe('extractAdminListFilterSearch', () => {
  test('should keep only the filter params', () => {
    expect(
      extractAdminListFilterSearch(
        '?state=draft&sort=title&page=2',
        'articles',
      ),
    ).toBe('state=draft')
  })

  test('should keep the trimmed search after the filters', () => {
    expect(
      extractAdminListFilterSearch(
        '?q=%20ples%20&state=draft&page=2',
        'articles',
      ),
    ).toBe('state=draft&q=ples')
    expect(extractAdminListFilterSearch('?q=%20%20', 'articles')).toBe('')
  })

  test('should keep the search on every list', () => {
    expect(
      extractAdminListFilterSearch('?q=foo&role=coordinator', 'authors'),
    ).toBe('role=coordinator&q=foo')
  })

  test('should serialize in schema key order regardless of input order', () => {
    expect(
      extractAdminListFilterSearch(
        '?tag=skola&state=draft&author=abc123',
        'articles',
      ),
    ).toBe('author=abc123&state=draft&tag=skola')
  })

  test('should serialize several values the same whatever their order', () => {
    expect(
      extractAdminListFilterSearch(
        '?state=pending&state=draft&category=sport&category=skola',
        'articles',
      ),
    ).toBe('category=skola&category=sport&state=draft&state=pending')
    expect(
      extractAdminListFilterSearch(
        '?category=skola&category=sport&state=draft&state=pending',
        'articles',
      ),
    ).toBe('category=skola&category=sport&state=draft&state=pending')
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
    expect(extractAdminListFilterSearch('?sort=title', 'authors')).toBe('')
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
    ).toBe('state=draft&q=foo')
  })

  test('should keep accepting a saved filter with one value', () => {
    expect(validateFilterQuery('state=draft&category=skola', 'articles')).toBe(
      'category=skola&state=draft',
    )
  })

  test('should accept a search alone', () => {
    expect(validateFilterQuery('?q=ples', 'articles')).toBe('q=ples')
  })

  test('should return null when nothing valid remains', () => {
    expect(validateFilterQuery('', 'articles')).toBe(null)
    expect(validateFilterQuery('?state=&category=', 'articles')).toBe(null)
    expect(validateFilterQuery('?sort=title&page=2', 'articles')).toBe(null)
    expect(validateFilterQuery('?category=rozhovory', 'authors')).toBe(null)
  })

  test('should return null for a table key that is no longer in the registry', () => {
    // The users list lost its filters (28d); a row could still carry its key.
    expect(
      validateFilterQuery('?role=member', 'users' as AdminListTableKey),
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

  test('should strip a stale value and keep the other values', () => {
    expect(
      redirectFor('?category=rozhovory&category=zaniklo&category=skola'),
    ).toBe('/administration/articles?category=rozhovory&category=skola')
  })

  test('should return null when several values are in menu order', () => {
    expect(redirectFor('?category=rozhovory&category=skola')).toBe(null)
  })

  test('should put several values in menu order and drop duplicates', () => {
    expect(redirectFor('?category=skola&category=rozhovory')).toBe(
      '/administration/articles?category=rozhovory&category=skola',
    )
    expect(redirectFor('?category=skola&category=skola')).toBe(
      '/administration/articles?category=skola',
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
    expect(hasParams('?category=rozhovory', 'authors')).toBe(false)
  })

  test('should detect an empty value as list state', () => {
    // `?state=` is what an explicitly cleared select submits — still explicit.
    expect(hasParams('?state=', 'articles')).toBe(true)
  })
})
