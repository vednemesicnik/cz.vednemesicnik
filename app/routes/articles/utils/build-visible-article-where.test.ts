import { describe, expect, test, vi } from 'vitest'

import type { WebContentVisibility } from '~/utils/permissions/author/get-web-content-visibility.server'

import { buildVisibleArticleWhere } from './build-visible-article-where'

const createVisibility = (
  where: WebContentVisibility['where'],
): WebContentVisibility => ({ where })

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

  test('a previewing author sees drafts only once they have an address (0020)', () => {
    const where = vi.fn(() => ({
      OR: [{ state: 'published' as const }, { state: 'draft' as const }],
    }))

    expect(
      buildVisibleArticleWhere(createVisibility(where), ['draft', 'archived']),
    ).toMatchObject({ slug: { not: null } })
    expect(where).toHaveBeenCalledWith('article', expect.any(Function), [
      'draft',
      'archived',
    ])
  })
})
