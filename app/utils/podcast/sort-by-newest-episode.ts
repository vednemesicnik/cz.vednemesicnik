type PodcastWithNewestEpisode = {
  episodes: { publishedAt: Date | null }[]
}

const newestEpisodeTime = ({ episodes }: PodcastWithNewestEpisode) =>
  episodes[0]?.publishedAt?.getTime() ?? 0

/**
 * Orders podcasts as /podcasts does in 13a: the podcast whose newest published
 * episode is the newest comes first, a podcast without one last. There is no
 * manual order.
 *
 * @param podcasts - Podcasts, each with its newest published episode first in
 *   `episodes` (`take: 1`, ordered by `publishedAt` descending).
 * @returns A new array; the sort is stable, so ties keep the input order.
 */
export const sortByNewestEpisode = <Podcast extends PodcastWithNewestEpisode>(
  podcasts: Podcast[],
) =>
  [...podcasts].sort(
    (first, second) => newestEpisodeTime(second) - newestEpisodeTime(first),
  )
