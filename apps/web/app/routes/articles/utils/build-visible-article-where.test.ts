import { describe, expect, test, vi } from 'vitest'

import type { WebContentVisibility } from '~/utils/permissions/author/get-web-content-visibility.server'

import { buildVisibleArticleWhere } from './build-visible-article-where'

// The real module reads the session secret on import; only the predicate is used.
vi.mock('~/utils/permissions/author/get-web-content-visibility.server', () => ({
  ownArticle: (authorId: string) => ({ authors: { some: { id: authorId } } }),
}))

const createVisibility = (
  where: WebContentVisibility['where'],
): WebContentVisibility => ({ previewMode: null, where })

describe('buildVisibleArticleWhere', () => {
  test('a visitor sees published articles with an address', () => {
    const visibility = createVisibility(
      vi.fn(() => ({ OR: [{ state: 'published' as const }] })),
    )

    expect(buildVisibleArticleWhere(visibility)).toEqual({
      OR: [{ state: 'published' }],
      slug: { not: null },
    })
  })

  test('a previewing author sees drafts and archived articles, drafts only once they have an address (0020, 10d)', () => {
    const where = vi.fn(() => ({
      OR: [{ state: 'published' as const }, { state: 'draft' as const }],
    }))

    expect(buildVisibleArticleWhere(createVisibility(where))).toMatchObject({
      slug: { not: null },
    })
    expect(where).toHaveBeenCalledWith('article', expect.any(Function), [
      'draft',
      'archived',
    ])
  })
})
