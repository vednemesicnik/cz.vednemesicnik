import { describe, expect, test } from 'vitest'

import { buildEpisodePermissionWhere } from './build-episode-permission-where'

type Context = Parameters<typeof buildEpisodePermissionWhere>[0]
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

describe('buildEpisodePermissionWhere', () => {
  test('a Contributor sees only their own episodes, in every state', () => {
    expect(
      buildEpisodePermissionWhere(
        createContext({ archived: own, draft: own, published: own }),
      ),
    ).toEqual({
      OR: [
        { state: 'draft', ...mine },
        { state: 'published', ...mine },
        { state: 'archived', ...mine },
      ],
    })
  })

  test('a Creator sees any draft and published episode, and their own archived', () => {
    expect(
      buildEpisodePermissionWhere(
        createContext({ archived: own, draft: any, published: any }),
      ),
    ).toEqual({
      OR: [
        { state: 'draft' },
        { state: 'published' },
        { state: 'archived', ...mine },
      ],
    })
  })

  test('a state the role cannot view is left out', () => {
    expect(
      buildEpisodePermissionWhere(
        createContext({ archived: none, draft: none, published: any }),
      ),
    ).toEqual({ OR: [{ state: 'published' }] })
  })

  test('a role that views nothing matches nothing', () => {
    expect(
      buildEpisodePermissionWhere(
        createContext({ archived: none, draft: none, published: none }),
      ),
    ).toEqual({ OR: [] })
  })
})
