import { describe, expect, it } from 'vitest'

import { summarizePodcastEpisodes } from './summarize-podcast-episodes'

const COORDINATOR_LEVEL = 1
const CREATOR_LEVEL = 2

const episode = (
  overrides: Partial<Parameters<typeof summarizePodcastEpisodes>[1][number]>,
) => ({
  isViewable: true,
  podcastId: 'kabinet',
  publishedAt: null,
  reviews: [],
  state: 'draft' as const,
  submittedAt: null,
  ...overrides,
})

const approvingReview = {
  createdAt: new Date('2026-09-26T10:00:00Z'),
  reviewer: { role: { level: COORDINATOR_LEVEL } },
}

describe('summarizePodcastEpisodes', () => {
  it('counts the published episodes and keeps the latest publish date', () => {
    const summaries = summarizePodcastEpisodes(
      ['kabinet'],
      [
        episode({
          publishedAt: new Date('2026-09-12T08:00:00Z'),
          state: 'published',
        }),
        episode({
          publishedAt: new Date('2026-09-19T08:00:00Z'),
          state: 'published',
        }),
        episode({
          publishedAt: new Date('2026-06-20T08:00:00Z'),
          state: 'published',
        }),
      ],
    )

    expect(summaries.get('kabinet')).toMatchObject({
      latestPublishedAt: new Date('2026-09-19T08:00:00Z'),
      publishedCount: 3,
    })
  })

  it('counts drafts by where they stand in review', () => {
    const summaries = summarizePodcastEpisodes(
      ['kabinet'],
      [
        episode({}),
        episode({ submittedAt: new Date('2026-09-25T08:00:00Z') }),
        episode({
          reviews: [approvingReview],
          submittedAt: new Date('2026-09-24T08:00:00Z'),
        }),
        // A Creator's review approves nothing.
        episode({
          reviews: [
            {
              createdAt: new Date('2026-09-26T10:00:00Z'),
              reviewer: { role: { level: CREATOR_LEVEL } },
            },
          ],
          submittedAt: new Date('2026-09-23T08:00:00Z'),
        }),
      ],
    )

    expect(summaries.get('kabinet')).toMatchObject({
      approvedCount: 1,
      draftCount: 1,
      pendingCount: 2,
      publishedCount: 0,
    })
  })

  it('counts every published episode but only the drafts the role may view', () => {
    // A Contributor views only their own episodes; the web shows all published.
    const summaries = summarizePodcastEpisodes(
      ['kabinet'],
      [
        episode({
          isViewable: false,
          publishedAt: new Date('2026-09-19T08:00:00Z'),
          state: 'published',
        }),
        episode({ isViewable: false }),
        episode({
          isViewable: false,
          submittedAt: new Date('2026-09-25T08:00:00Z'),
        }),
        episode({ isViewable: true }),
      ],
    )

    expect(summaries.get('kabinet')).toMatchObject({
      draftCount: 1,
      pendingCount: 0,
      publishedCount: 1,
    })
  })

  it('leaves out archived episodes', () => {
    const summaries = summarizePodcastEpisodes(
      ['kabinet'],
      [
        episode({
          publishedAt: new Date('2026-05-14T08:00:00Z'),
          state: 'archived',
        }),
      ],
    )

    expect(summaries.get('kabinet')).toEqual({
      approvedCount: 0,
      draftCount: 0,
      latestPublishedAt: null,
      pendingCount: 0,
      publishedCount: 0,
    })
  })

  it('gives a podcast without episodes zeros', () => {
    const summaries = summarizePodcastEpisodes(['prestavka'], [])

    expect(summaries.get('prestavka')).toEqual({
      approvedCount: 0,
      draftCount: 0,
      latestPublishedAt: null,
      pendingCount: 0,
      publishedCount: 0,
    })
  })
})
