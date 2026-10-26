import { describe, expect, it } from 'vitest'

import { formatPodcastEpisodeLines } from './format-podcast-episode-lines'
import type { PodcastEpisodeSummary } from './summarize-podcast-episodes'

const summary = (
  overrides: Partial<PodcastEpisodeSummary>,
): PodcastEpisodeSummary => ({
  approvedCount: 0,
  draftCount: 0,
  latestPublishedAt: null,
  pendingCount: 0,
  publishedCount: 0,
  ...overrides,
})

describe('formatPodcastEpisodeLines', () => {
  it('says what is in progress, marked while something waits', () => {
    expect(
      formatPodcastEpisodeLines({
        isContributor: false,
        podcastState: 'published',
        summary: summary({
          draftCount: 1,
          latestPublishedAt: new Date('2026-09-19T08:00:00Z'),
          pendingCount: 1,
          publishedCount: 11,
        }),
      }),
    ).toMatchObject({
      count: '11 na webu',
      detail: '1 ke schválení · 1 koncept',
      isPending: true,
    })
  })

  it('names approved episodes between the waiting ones and the drafts', () => {
    expect(
      formatPodcastEpisodeLines({
        isContributor: false,
        podcastState: 'published',
        summary: summary({
          approvedCount: 2,
          draftCount: 5,
          pendingCount: 5,
          publishedCount: 24,
        }),
      }),
    ).toMatchObject({
      count: '24 na webu',
      detail: '5 ke schválení · 2 schválené · 5 konceptů',
      isPending: true,
    })
  })

  it('leaves an approved episode unmarked', () => {
    expect(
      formatPodcastEpisodeLines({
        isContributor: false,
        podcastState: 'published',
        summary: summary({ approvedCount: 1, publishedCount: 3 }),
      }),
    ).toMatchObject({
      count: '3 na webu',
      detail: '1 schválená',
      isPending: false,
    })
  })

  it("gives a Contributor's submitted episodes one word, unmarked", () => {
    expect(
      formatPodcastEpisodeLines({
        isContributor: true,
        podcastState: 'published',
        summary: summary({
          approvedCount: 1,
          draftCount: 2,
          pendingCount: 1,
          publishedCount: 11,
        }),
      }),
    ).toMatchObject({
      count: '11 na webu',
      detail: '2 odeslané · 2 koncepty',
      isPending: false,
    })
  })

  it('gives the latest episode date when nothing is in progress', () => {
    expect(
      formatPodcastEpisodeLines({
        isContributor: false,
        podcastState: 'published',
        summary: summary({
          latestPublishedAt: new Date('2026-09-19T08:00:00Z'),
          publishedCount: 24,
        }),
      }),
    ).toMatchObject({
      count: '24 na webu',
      detail: 'poslední 19. 9. 2026',
      isPending: false,
    })
  })

  it('names the episodes of a podcast that is not on the web', () => {
    expect(
      formatPodcastEpisodeLines({
        isContributor: false,
        podcastState: 'archived',
        summary: summary({
          latestPublishedAt: new Date('2025-10-02T08:00:00Z'),
          publishedCount: 6,
        }),
      }),
    ).toMatchObject({
      count: '6 epizod',
      detail: 'poslední 2. 10. 2025',
      isPending: false,
    })
  })

  it('says none is on the web for a podcast without episodes', () => {
    expect(
      formatPodcastEpisodeLines({
        isContributor: false,
        podcastState: 'draft',
        summary: summary({}),
      }),
    ).toMatchObject({ count: 'žádné na webu', detail: null, isPending: false })
  })

  it('counts only the drafts the summary holds for a Contributor', () => {
    expect(
      formatPodcastEpisodeLines({
        isContributor: true,
        podcastState: 'draft',
        summary: summary({ draftCount: 1 }),
      }),
    ).toMatchObject({
      count: 'žádné na webu',
      detail: '1 koncept',
      isPending: false,
    })
  })

  // A phone has no column header, so the count names the episodes (32c).
  it.each([
    ['published', 11, '11 epizod na webu'],
    ['published', 1, '1 epizoda na webu'],
    ['published', 3, '3 epizody na webu'],
    ['published', 0, 'žádné epizody na webu'],
    ['archived', 6, '6 epizod'],
    ['draft', 0, 'žádné epizody na webu'],
  ] as const)(
    'names the episodes on a phone: %s podcast, %i published, "%s"',
    (podcastState, publishedCount, phoneCount) => {
      expect(
        formatPodcastEpisodeLines({
          isContributor: false,
          podcastState,
          summary: summary({ publishedCount }),
        }).phoneCount,
      ).toBe(phoneCount)
    },
  )
})
