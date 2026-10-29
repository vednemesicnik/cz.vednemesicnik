import { PUBLISHED_ARTICLE_COUNT_FORMS } from '~/config/bulk-noun-config'
import { formatListCount } from '~/utils/format-list-count'

/**
 * The published articles of a category or tag on a phone, where the count
 * loses its column header (design 32a, copy sa53xexi). Zero too, so every row
 * has three lines.
 *
 * @param count - The record's published articles.
 * @returns `1 publikovaný článek`, `2 publikované články`,
 *   `5 publikovaných článků`, `0 publikovaných článků`.
 */
export const formatPublishedArticleCount = (count: number) =>
  formatListCount(count, PUBLISHED_ARTICLE_COUNT_FORMS)
