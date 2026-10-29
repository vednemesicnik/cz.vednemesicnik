import type { LiveChange } from '~/routes/administration/articles/_index/utils/use-live-article-rows'

import type { DashboardItem } from '../../dashboard-item'
import type { DashboardSectionKind } from '../../dashboard-section-kind'
import { ArticleDashboardRow } from '../article-dashboard-row'
import { EpisodeDashboardRow } from '../episode-dashboard-row'
import { IssueDashboardRow } from '../issue-dashboard-row'
import { PodcastDashboardRow } from '../podcast-dashboard-row'
import { TaxonomyDashboardRow } from '../taxonomy-dashboard-row'

type Props = {
  item: DashboardItem
  section: DashboardSectionKind
  isApprover: boolean
  liveChange: LiveChange | undefined
  now: Date
}

/**
 * A dashboard row by its type (design 21a): every type its list's row, in one
 * queue.
 */
export const DashboardItemRow = ({ item, ...props }: Props) => {
  switch (item.type) {
    case 'article':
      return <ArticleDashboardRow item={item} {...props} />
    case 'issue':
      return <IssueDashboardRow item={item} {...props} />
    case 'episode':
      return <EpisodeDashboardRow item={item} {...props} />
    case 'podcast':
      return <PodcastDashboardRow item={item} {...props} />
    case 'category':
    case 'tag':
      return <TaxonomyDashboardRow item={item} {...props} />
  }
}
