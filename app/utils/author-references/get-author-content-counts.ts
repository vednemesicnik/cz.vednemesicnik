import type { AuthorContentType } from '~/config/author-content-count-config'
import {
  ARTICLE_NOUN,
  CATEGORY_NOUN,
  type CountForms,
  EPISODE_NOUN,
  ISSUE_NOUN,
  PODCAST_NOUN,
  TAG_NOUN,
} from '~/config/list-noun-config'
import { formatListCount } from '~/utils/format-list-count'

export type AuthorContentCount = {
  type: AuthorContentType
  label: string
}

// The order of 28b's line: what an author writes first, then what it set up.
const COUNT_ORDER: [AuthorContentType, CountForms][] = [
  ['articles', ARTICLE_NOUN.countForms],
  ['podcastEpisodes', EPISODE_NOUN.countForms],
  ['issues', ISSUE_NOUN.countForms],
  ['podcasts', PODCAST_NOUN.countForms],
  ['articleCategories', CATEGORY_NOUN.countForms],
  ['articleTags', TAG_NOUN.countForms],
]

/**
 * The content an author stands on, as the author detail's count line names it
 * (design 28b): `52 článků`, `9 epizod`, `3 čísla`. Categories and tags are
 * counted apart, as the 28g dialog counts them.
 *
 * @param contentCounts - The counts from `getAuthorDeleteBlock`.
 * @returns The non-zero counts in the line's order.
 */
export const getAuthorContentCounts = (
  contentCounts: Record<AuthorContentType, number>,
): AuthorContentCount[] =>
  COUNT_ORDER.filter(([type]) => contentCounts[type] > 0).map(
    ([type, countForms]) => ({
      label: formatListCount(contentCounts[type], countForms),
      type,
    }),
  )
