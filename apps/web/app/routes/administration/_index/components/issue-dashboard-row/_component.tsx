import { TableNameNote, TableStateCell } from '~/components/admin/admin-table'
import { StatusTag } from '~/components/status-tag'
import { StatusTagDetail } from '~/components/status-tag-detail'
import { IssueActionDialogs } from '~/routes/administration/archive/components/issue-action-dialogs'
import { ISSUE_ACTION_LABELS } from '~/routes/administration/archive/utils/issue-actions'
import { useIssueActions } from '~/routes/administration/archive/utils/use-issue-actions'
import { getRowTint } from '~/utils/live-change/get-row-tint'
import { SECTION_ROW_ACTION } from '../../dashboard-section-kind'
import { getDashboardRowActions } from '../../utils/get-dashboard-row-actions'
import { getDashboardRowLines } from '../../utils/get-dashboard-row-lines'
import { DashboardRow } from '../dashboard-row'
import type { DashboardRowProps } from '../dashboard-row/dashboard-row-props'
import { DashboardRowActions } from '../dashboard-row-actions'
import { DashboardRowName } from '../dashboard-row-name'
import { DashboardRowTitle } from '../dashboard-row-title'

/**
 * An issue's dashboard row (design 21a, 21b): the archive list's row data and
 * actions (26a), its dialogs included; under the name its order.
 */
export const IssueDashboardRow = ({
  item,
  section,
  isApprover,
  liveChange,
  now,
}: DashboardRowProps<'issue'>) => {
  const { row } = item
  const actions = useIssueActions({
    fetcherKey: `dashboard-issue-${row.id}`,
    issue: row,
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
    holdLine: row.holdLine,
    liveChange,
    now,
    section,
  })

  return (
    <DashboardRow
      muted={row.state === 'archived'}
      tint={getRowTint(liveChange)}
      type={'issue'}
    >
      <DashboardRowName>
        <DashboardRowTitle to={item.detailHref}>{item.title}</DashboardRowTitle>
        {note !== null && <TableNameNote>{note}</TableNameNote>}
      </DashboardRowName>
      <TableStateCell>
        <StatusTag state={row.submission ?? row.state}>
          {detail !== undefined && <StatusTagDetail>{detail}</StatusTagDetail>}
        </StatusTag>
      </TableStateCell>
      <DashboardRowActions
        editHref={actions.editHref}
        getLabel={(action) => ISSUE_ACTION_LABELS[action]}
        isSubmitting={actions.isSubmitting}
        menu={menu}
        menuLabel={`Další akce s číslem ${item.title}`}
        onRun={actions.runAction}
        row={rowAction}
      >
        <IssueActionDialogs
          actions={actions}
          canDelete={allActions.includes('delete')}
          isApprover={isApprover}
          issue={row}
        />
      </DashboardRowActions>
    </DashboardRow>
  )
}
