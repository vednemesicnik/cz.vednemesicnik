import { getTaxonomyFactLine } from '../../articles/utils/get-taxonomy-fact-line'

type Options = Parameters<typeof getTaxonomyFactLine>[0]

/**
 * The one line under a podcast's state tag in the list (design 27a): the
 * issue's line (26a), with the draft's author named as such.
 *
 * @returns `Autor: Tomáš Kříž` for a draft nobody submitted, else the
 *   category's line: `Odesláno · Jakub Novák · 26. 9. 2026`,
 *   `Archivováno 3. 1. 2026`, nothing for a published podcast.
 */
export const getPodcastFactLine = (options: Options): string | null =>
  options.state === 'draft' && options.submission === null
    ? `Autor: ${options.authorName}`
    : getTaxonomyFactLine(options)
