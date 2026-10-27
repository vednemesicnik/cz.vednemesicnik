import { describe, expect, it, vi } from 'vitest'

import type { WebContentVisibility } from '~/utils/permissions/author/get-web-content-visibility.server'

import { buildWebVisibleEpisodeWhere } from './build-web-visible-episode-where'

// The module reads the session and the database; only its "mine" predicate is used.
vi.mock('~/utils/permissions/author/get-web-content-visibility.server', () => ({
  ownByAuthor: (authorId: string) => ({ authorId }),
}))

// A visibility that names the entity and the previewed states it was asked for.
const createVisibility = () =>
  ({
    where: vi.fn((entity: string, ownFilter, previewStates: string[]) => ({
      entity,
      own: ownFilter('author-1'),
      previewStates,
    })),
  }) as unknown as WebContentVisibility

describe('buildWebVisibleEpisodeWhere', () => {
  it('asks for the podcast with its drafts and archived ones, by its author', () => {
    const { podcast } = buildWebVisibleEpisodeWhere(createVisibility())

    expect(podcast).toEqual({
      entity: 'podcast',
      own: { authorId: 'author-1' },
      previewStates: ['draft', 'archived'],
    })
  })

  it('asks for the episode the same way and leaves an empty draft out', () => {
    const { episode } = buildWebVisibleEpisodeWhere(createVisibility())

    expect(episode).toEqual({
      entity: 'podcast_episode',
      firstContentAt: { not: null },
      own: { authorId: 'author-1' },
      previewStates: ['draft', 'archived'],
    })
  })
})
