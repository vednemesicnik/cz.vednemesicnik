import type { CountForms } from '~/config/list-noun-config'
import { formatListCount } from '~/utils/format-list-count'

const PUBLISHED_EPISODE_COUNT_FORMS: CountForms = {
  few: 'publikované epizody',
  many: 'publikované epizody',
  one: 'publikovaná epizoda',
  other: 'publikovaných epizod',
  two: 'publikovaných epizod',
  zero: 'publikovaných epizod',
}

/**
 * A podcast's published episodes, as the archive dialog names them (design
 * 27a, copy djni9qbc).
 *
 * @param count - The podcast's published episodes.
 * @returns `1 publikovaná epizoda`, `2 publikované epizody`,
 *   `11 publikovaných epizod`, `21 publikovaných epizod`.
 */
export const formatPublishedEpisodeCount = (count: number) =>
  formatListCount(count, PUBLISHED_EPISODE_COUNT_FORMS)
