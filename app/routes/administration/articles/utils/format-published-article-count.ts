import type { CountForms } from '~/config/list-noun-config'
import { formatListCount } from '~/utils/format-list-count'

const PUBLISHED_ARTICLE_COUNT_FORMS: CountForms = {
  few: 'publikované články',
  many: 'publikovaného článku',
  one: 'publikovaný článek',
  other: 'publikovaných článků',
  two: 'publikovaných článků',
  zero: 'publikovaných článků',
}

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
