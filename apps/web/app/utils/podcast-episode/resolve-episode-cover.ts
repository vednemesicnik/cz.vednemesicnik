import {
  createImageSources,
  type ImageRow,
} from '~/utils/image-store/create-image-sources'

type CoverRow = ImageRow & { altText: string }

type Options = {
  cover: CoverRow | null
  podcastCover: CoverRow | null
}

/**
 * The cover an episode shows on the web: its own, otherwise its podcast's
 * (5hl7vx3a, 13a, 13c), so a reader can't tell the two apart.
 *
 * @param options - The episode's cover row and its podcast's.
 * @returns The alt text and the image sources, or `null` when neither has a
 *   cover: the page then shows none (0q3rezo1).
 */
export const resolveEpisodeCover = ({ cover, podcastCover }: Options) => {
  if (cover !== null) {
    return {
      altText: cover.altText,
      sources: createImageSources('podcast-episode-cover', cover),
    }
  }

  if (podcastCover !== null) {
    return {
      altText: podcastCover.altText,
      sources: createImageSources('podcast-cover', podcastCover),
    }
  }

  return null
}
