export function getPodcastEpisodeCoverSrc(id: string) {
  return `/resources/podcast-episode-cover/${id}` as const
}
