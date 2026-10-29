import type { LiveChange } from '~/routes/administration/articles/_index/utils/use-live-article-rows'

import type { DashboardItem } from '../../dashboard-item'
import type { DashboardSectionKind } from '../../dashboard-section-kind'

/** What every type's dashboard row takes (design 21a, 21b). */
export type DashboardRowProps<Type extends DashboardItem['type']> = {
  item: Extract<DashboardItem, { type: Type }>
  section: DashboardSectionKind
  isApprover: boolean
  liveChange: LiveChange | undefined
  now: Date
}
