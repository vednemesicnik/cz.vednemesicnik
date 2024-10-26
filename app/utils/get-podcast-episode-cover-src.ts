import { createImageSearchParamsString } from "~/utils/create-image-search-params-string"

export function getPodcastEpisodeCoverSrc(
  id: string,
  options?: { width?: number; quality?: number }
) {
  const imageSearchParamsString = createImageSearchParamsString(
    options?.width,
    options?.quality
  )

  return `/resources/podcast-episode-cover/${id}${imageSearchParamsString}`
}
