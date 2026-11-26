import { describe, expect, test } from 'vitest'

import { buildPodcastPermissionWhere } from './build-podcast-permission-where'

type Context = Parameters<typeof buildPodcastPermissionWhere>[0]
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
const mine = { authorId: 'author-1' }

describe('buildPodcastPermissionWhere', () => {
  test('a Contributor sees only their own non-empty podcasts, in every state', () => {
    expect(
      buildPodcastPermissionWhere(
        createContext({ archived: own, draft: own, published: own }),
      ),
    ).toEqual({
      firstContentAt: { not: null },
      OR: [
        { state: 'draft', ...mine },
        { state: 'published', ...mine },
        { state: 'archived', ...mine },
      ],
    })
  })

  test('the Coordinator sees every non-empty podcast', () => {
    expect(
      buildPodcastPermissionWhere(
        createContext({ archived: any, draft: any, published: any }),
      ),
    ).toEqual({
      firstContentAt: { not: null },
      OR: [{ state: 'draft' }, { state: 'published' }, { state: 'archived' }],
    })
  })
})
