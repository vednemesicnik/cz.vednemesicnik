import {
  AUTHOR_CONTENT_COUNT_FORMS,
  AUTHOR_CONTENT_TYPES,
  type AuthorContentType,
} from '~/config/author-content-count-config'
import { formatListCount } from '~/utils/format-list-count'

const listFormat = new Intl.ListFormat('cs', { type: 'conjunction' })

// A number stays on the line of its noun, „12 článků“ (copy zq7c99v0).
const NO_BREAK_SPACE = ' '

/**
 * The content an author stands on, as it follows „Autor je uveden u“ (28g).
 * The counts are text, not links (dksfb82t).
 *
 * @param contentCounts - The counts from `getAuthorDeleteBlock`.
 * @returns The non-zero counts in the genitive, joined: `1 článku a 2 rubrik`,
 *   `1 článku, 2 rubrik a 5 štítků`, each number kept with its noun and „a“
 *   with the next word by no-break spaces; an empty string when there are none.
 */
export const formatAuthorContentCounts = (
  contentCounts: Record<AuthorContentType, number>,
) =>
  listFormat.format(
    AUTHOR_CONTENT_TYPES.filter((type) => contentCounts[type] > 0).map((type) =>
      formatListCount(
        contentCounts[type],
        AUTHOR_CONTENT_COUNT_FORMS[type],
      ).replace(' ', NO_BREAK_SPACE),
    ),
  )
