import { formatEpisodeTitle } from './format-episode-title'

type Options = {
  number: number | null
  title: string
}

/**
 * The episode cover's alt text, composed from the title as the issue's; the
 * editors don't write it (design 27d, as 26c).
 *
 * @param options - The episode's number and title.
 * @returns „Obálka epizody #14 Školník, který ví všechno“, or „Obálka
 *   epizody“ for a draft with neither.
 */
export const getEpisodeCoverAltText = ({ number, title }: Options): string =>
  `Obálka epizody ${formatEpisodeTitle({ number, title: title.trim() })}`.trim()
