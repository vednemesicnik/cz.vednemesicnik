import { DRAFT_COUNT_FORMS } from '~/config/bulk-noun-config'
import { formatListCount } from '~/utils/format-list-count'

/**
 * Formats a draft count with the Czech plural of "koncept".
 *
 * @param count - The number of drafts.
 * @returns `1 koncept`, `2 koncepty`, `5 konceptů`, `0 konceptů`.
 */
export const formatDraftCount = (count: number) =>
  formatListCount(count, DRAFT_COUNT_FORMS)
