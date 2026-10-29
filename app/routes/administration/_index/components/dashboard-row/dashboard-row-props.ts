import type { LiveChange } from '~/hooks/use-live-changes'

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
