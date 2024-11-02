export function getPodcastCoverSrc(id: string) {
  return `/resources/podcast-cover/${id}` as const
}
