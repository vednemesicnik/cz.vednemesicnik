import { getTaxonomyFactLine } from '../../articles/utils/get-taxonomy-fact-line'

type Options = Parameters<typeof getTaxonomyFactLine>[0]

/**
 * The one line under an issue's state tag in the list (design 26a, copy
 * yzyd9p1l): the category's line (25a), with the draft's author named as such.
 *
 * @returns `Autor: Ondřej Beneš` for a draft nobody submitted, else the
 *   category's line: `Odesláno · Jakub Novák · 26. 9. 2026`,
 *   `Archivováno 14. 6. 2026`, nothing for a published issue.
 */
export const getIssueFactLine = (options: Options): string | null =>
  options.state === 'draft' && options.submission === null
    ? `Autor: ${options.authorName}`
    : getTaxonomyFactLine(options)
