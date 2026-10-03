import { describe, expect, test } from 'vitest'

import {
  getAdminContentKind,
  getWebsiteContentKind,
} from '~/components/boundary-error/utils/content-kind'

describe('getWebsiteContentKind', () => {
  test.each([
    ['/articles/some-article', 'article'],
    ['/articles/categories/school', 'category'],
    ['/articles/tags/interview', 'tag'],
    ['/podcasts/some-podcast', 'podcast'],
    ['/podcasts/some-podcast/some-episode', 'episode'],
    ['/archive/2024-01.pdf', 'issue'],
  ])('%s → %s', (pathname, kind) => {
    expect(getWebsiteContentKind(pathname)).toBe(kind)
  })

  test.each([
    '/',
    '/articles',
    '/articles/categories',
    '/articles/tags',
    '/articles/some-article/extra',
    '/articles/categories/school/extra',
    '/podcasts',
    '/podcasts/a/b/c',
    '/archive',
    '/archive/a/b',
    '/grants/some-grant',
    '/nope',
  ])('%s → null', (pathname) => {
    expect(getWebsiteContentKind(pathname)).toBeNull()
  })
})

describe('getAdminContentKind', () => {
  test.each([
    ['/administration/articles/a1', { kind: 'article' }],
    ['/administration/articles/a1/edit-article', { kind: 'article' }],
    ['/administration/articles/categories/c1', { kind: 'category' }],
    ['/administration/articles/tags/t1/edit-tag', { kind: 'tag' }],
    ['/administration/archive/i1', { kind: 'issue' }],
    ['/administration/podcasts/p1', { kind: 'podcast' }],
    [
      '/administration/podcasts/p1/episodes/e1',
      { kind: 'episode', podcastId: 'p1' },
    ],
    ['/administration/users/u1', { kind: 'user' }],
    ['/administration/authors/a1/edit-author', { kind: 'author' }],
  ])('%s → %o', (pathname, match) => {
    expect(getAdminContentKind(pathname)).toEqual(match)
  })

  test.each([
    '/administration',
    '/administration/articles',
    '/administration/articles/add-article',
    '/administration/articles/categories',
    '/administration/podcasts/p1/episodes',
    '/administration/podcasts/p1/episodes/add-episode',
    '/administration/settings/profile',
    '/administration/nope',
    '/articles/some-article',
  ])('%s → null', (pathname) => {
    expect(getAdminContentKind(pathname)).toBeNull()
  })
})
