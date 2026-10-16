import { describe, expect, test } from 'vitest'

import { buildArticlePermissionWhere } from './build-article-permission-where'

type Context = Parameters<typeof buildArticlePermissionWhere>[0]
type Rights = { hasOwn: boolean; hasAny: boolean }

const createContext = (rights: Record<string, Rights>): Context => ({
  authorId: 'author-1',
  can: (({ state }: { state: string }) => ({
    ...rights[state],
    hasPermission: rights[state].hasOwn || rights[state].hasAny,
  })) as Context['can'],
})

const own = { hasAny: false, hasOwn: true }
const any = { hasAny: true, hasOwn: false }
const none = { hasAny: false, hasOwn: false }
const mine = { authors: { some: { id: 'author-1' } } }
const nonEmpty = { firstContentAt: { not: null } }

describe('buildArticlePermissionWhere', () => {
  test('a Contributor sees only their own articles, in every state', () => {
    expect(
      buildArticlePermissionWhere(
        createContext({ archived: own, draft: own, published: own }),
      ),
    ).toEqual({
      ...nonEmpty,
      OR: [
        { state: 'draft', ...mine },
        { state: 'published', ...mine },
        { state: 'archived', ...mine },
      ],
    })
  })

  test('a Creator sees any draft and published article, and their own archived', () => {
    expect(
      buildArticlePermissionWhere(
        createContext({ archived: own, draft: any, published: any }),
      ),
    ).toEqual({
      ...nonEmpty,
      OR: [
        { state: 'draft' },
        { state: 'published' },
        { state: 'archived', ...mine },
      ],
    })
  })

  test('a state the role cannot view is left out', () => {
    expect(
      buildArticlePermissionWhere(
        createContext({ archived: none, draft: none, published: any }),
      ),
    ).toEqual({ ...nonEmpty, OR: [{ state: 'published' }] })
  })

  test('an empty draft is in no state the role views (decision 0020)', () => {
    expect(
      buildArticlePermissionWhere(
        createContext({ archived: any, draft: any, published: any }),
      ),
    ).toMatchObject(nonEmpty)
  })
})
