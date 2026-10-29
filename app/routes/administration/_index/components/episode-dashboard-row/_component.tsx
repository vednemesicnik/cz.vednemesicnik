import { EpisodeActionDialogs } from '~/routes/administration/podcasts/podcast/episodes/components/episode-action-dialogs'
import { EPISODE_ACTION_LABELS } from '~/routes/administration/podcasts/podcast/episodes/utils/episode-actions'
import { useEpisodeActions } from '~/routes/administration/podcasts/podcast/episodes/utils/use-episode-actions'

import { SECTION_ROW_ACTION } from '../../dashboard-section-kind'
import { DASHBOARD_TYPE_COPY } from '../../dashboard-types'
import { getDashboardRowActions } from '../../utils/get-dashboard-row-actions'
import { getDashboardRowLines } from '../../utils/get-dashboard-row-lines'
import { DashboardRow } from '../dashboard-row'
import type { DashboardRowProps } from '../dashboard-row/dashboard-row-props'
import { getRowTint } from '../dashboard-row/get-row-tint'
import { DashboardRowActions } from '../dashboard-row-actions'

/**
 * An episode's dashboard row (design 21a, 21b): the episode table's row data
 * and actions (27b), its dialogs included; under the name its podcast.
 */
export const EpisodeDashboardRow = ({
  item,
  section,
  isApprover,
  liveChange,
  now,
}: DashboardRowProps<'episode'>) => {
  const { row } = item
  const actions = useEpisodeActions({
    episode: row,
    fetcherKey: `dashboard-episode-${row.id}`,
    podcast: item.podcast,
  })
  const allActions = row.row === null ? row.menu : [row.row, ...row.menu]
  const { row: rowAction, menu } = getDashboardRowActions({
    actions: allActions,
    preferred: SECTION_ROW_ACTION[section],
  })
  const { note, detail } = getDashboardRowLines({
    authorLine: item.authorLine,
    contextLine: item.contextLine,
    factLine: row.factLine,
    holdLine: null,
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
      typeLabel={DASHBOARD_TYPE_COPY.episode.label}
    >
      <DashboardRowActions
        editHref={actions.editHref}
        getLabel={(action) => EPISODE_ACTION_LABELS[action]}
        isSubmitting={actions.isSubmitting}
        menu={menu}
        menuLabel={`Další akce s epizodou ${item.title}`}
        onRun={actions.runAction}
        row={rowAction}
      >
        <EpisodeActionDialogs
          actions={actions}
          canDelete={allActions.includes('delete')}
          episode={{ ...row, title: item.title }}
          isApprover={isApprover}
        />
      </DashboardRowActions>
    </DashboardRow>
  )
}
