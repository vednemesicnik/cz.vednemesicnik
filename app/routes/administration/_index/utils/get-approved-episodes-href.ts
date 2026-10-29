import { href } from 'react-router'

/**
 * Where *Zobrazit schválené* leads for episodes (design 21a), which have no
 * list of their own: their podcast's page filtered to the approved when they
 * are all one podcast's, the podcast list otherwise, whose rows count each
 * podcast's approved episodes.
 *
 * @param podcastIds - The podcasts the approved episodes belong to.
 * @returns The address.
 */
export const getApprovedEpisodesHref = (podcastIds: ReadonlySet<string>) => {
  const [onlyPodcastId] = podcastIds

  return podcastIds.size === 1 && onlyPodcastId !== undefined
    ? `${href('/administration/podcasts/:podcastId', { podcastId: onlyPodcastId })}?${new URLSearchParams({ state: 'approved' })}`
    : href('/administration/podcasts')
}
