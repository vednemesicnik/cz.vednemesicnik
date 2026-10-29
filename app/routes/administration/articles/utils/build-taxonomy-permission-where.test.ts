import { describe, expect, test } from 'vitest'

import { buildTaxonomyPermissionWhere } from './build-taxonomy-permission-where'

type Context = Parameters<typeof buildTaxonomyPermissionWhere>[0]
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
const mine = { authorId: 'author-1' }

describe('buildTaxonomyPermissionWhere', () => {
  test('a Contributor sees only their own categories, in every state', () => {
    expect(
      buildTaxonomyPermissionWhere(
        createContext({ archived: own, draft: own, published: own }),
        'article_category',
      ),
    ).toEqual({
      OR: [
        { state: 'draft', ...mine },
        { state: 'published', ...mine },
        { state: 'archived', ...mine },
      ],
    })
  })

  test('the Coordinator sees every tag', () => {
    expect(
      buildTaxonomyPermissionWhere(
        createContext({ archived: any, draft: any, published: any }),
        'article_tag',
      ),
    ).toEqual({
      OR: [{ state: 'draft' }, { state: 'published' }, { state: 'archived' }],
    })
  })

  test('a role that views nothing matches nothing', () => {
    expect(
      buildTaxonomyPermissionWhere(
        createContext({ archived: none, draft: none, published: none }),
        'article_category',
      ),
    ).toEqual({ OR: [] })
  })
})
