import { PUBLISHED_EPISODE_COUNT_FORMS } from '~/config/bulk-noun-config'
import { formatListCount } from '~/utils/format-list-count'

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
