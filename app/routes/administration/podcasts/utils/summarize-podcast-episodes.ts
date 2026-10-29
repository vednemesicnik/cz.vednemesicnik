import type { ContentState } from '@generated/prisma/enums'

import { getSubmissionState } from '~/utils/permissions/author/submission/get-submission-state'

type EpisodeRow = {
  podcastId: string
  state: ContentState
  submittedAt: Date | null
  publishedAt: Date | null
  reviews: { createdAt: Date; reviewer: { role: { level: number } } }[]
  isViewable: boolean
}

/** A podcast's episodes as its list row counts them (design 27a). */
export type PodcastEpisodeSummary = {
  publishedCount: number
  pendingCount: number
  approvedCount: number
  draftCount: number
  latestPublishedAt: Date | null
}

/**
 * Counts the episodes of the listed podcasts for the Epizody column (design
 * 27a). The published ones are what the web shows, so every published
 * episode counts whoever looks; the drafts count only where the signed-in
 * author may view them, so a Contributor sees their own.
 *
 * @param podcastIds - The listed podcasts.
 * @param episodes - Their episodes, each with whether the signed-in author
 *   may view it.
 * @returns Per podcast id, zeros included: the published count and the latest
 *   publish date, and the drafts by where they stand in review (07a).
 */
export const summarizePodcastEpisodes = (
  podcastIds: string[],
  episodes: EpisodeRow[],
) => {
  const summaries = new Map<string, PodcastEpisodeSummary>(
    podcastIds.map((podcastId) => [
      podcastId,
      {
        approvedCount: 0,
        draftCount: 0,
        latestPublishedAt: null,
        pendingCount: 0,
        publishedCount: 0,
      },
    ]),
  )

  for (const episode of episodes) {
    const summary = summaries.get(episode.podcastId)

    if (summary === undefined) continue

    if (episode.state === 'published') {
      summary.publishedCount += 1

      if (
        episode.publishedAt !== null &&
        (summary.latestPublishedAt === null ||
          episode.publishedAt > summary.latestPublishedAt)
      ) {
        summary.latestPublishedAt = episode.publishedAt
      }
    } else if (episode.state === 'draft' && episode.isViewable) {
      const submission = getSubmissionState(episode)

      if (submission === null) summary.draftCount += 1
      else if (submission.state === 'pending') summary.pendingCount += 1
      else summary.approvedCount += 1
    }
  }

  return summaries
}
