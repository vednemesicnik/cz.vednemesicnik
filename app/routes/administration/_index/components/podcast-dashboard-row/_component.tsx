import { PodcastActionDialogs } from '~/routes/administration/podcasts/components/podcast-action-dialogs'
import { PODCAST_ACTION_LABELS } from '~/routes/administration/podcasts/utils/podcast-actions'
import { usePodcastActions } from '~/routes/administration/podcasts/utils/use-podcast-actions'
import { getRowTint } from '~/utils/live-change/get-row-tint'
import { SECTION_ROW_ACTION } from '../../dashboard-section-kind'
import { DASHBOARD_TYPE_COPY } from '../../dashboard-types'
import { getDashboardRowActions } from '../../utils/get-dashboard-row-actions'
import { getDashboardRowLines } from '../../utils/get-dashboard-row-lines'
import { DashboardRow } from '../dashboard-row'
import type { DashboardRowProps } from '../dashboard-row/dashboard-row-props'
import { DashboardRowActions } from '../dashboard-row-actions'

/**
 * A podcast's dashboard row (design 21a, 21b): the podcast list's row data
 * and actions (27a), its dialogs included. The list puts every action in „⋯“;
 * the dashboard's section takes its own out onto the row.
 */
export const PodcastDashboardRow = ({
  item,
  section,
  isApprover,
  liveChange,
  now,
}: DashboardRowProps<'podcast'>) => {
  const { row } = item
  const actions = usePodcastActions({
    deleteRedirects: false,
    fetcherKey: `dashboard-podcast-${row.id}`,
    podcast: row,
  })
  const { row: rowAction, menu } = getDashboardRowActions({
    actions: row.actions,
    preferred: SECTION_ROW_ACTION[section],
  })
  const { note, detail } = getDashboardRowLines({
    authorLine: item.authorLine,
    contextLine: item.contextLine,
    factLine: row.factLine,
    holdLine: row.holdLine,
    liveChange,
    now,
    section,
  })

  return (
    <DashboardRow
      detail={detail}
      detailHref={item.detailHref}
      muted={row.state === 'archived'}
      note={note}
      state={row.submission ?? row.state}
      tint={getRowTint(liveChange)}
      title={item.title}
      typeLabel={DASHBOARD_TYPE_COPY.podcast.label}
    >
      <DashboardRowActions
        getLabel={(action) => PODCAST_ACTION_LABELS[action]}
        isSubmitting={actions.isSubmitting}
        menu={menu}
        menuLabel={`Další akce s podcastem ${item.title}`}
        onRun={actions.runAction}
        row={rowAction}
      >
        <PodcastActionDialogs
          actions={actions}
          canDelete={row.actions.includes('delete')}
          isApprover={isApprover}
          linksEpisodes={true}
        />
      </DashboardRowActions>
    </DashboardRow>
  )
}
