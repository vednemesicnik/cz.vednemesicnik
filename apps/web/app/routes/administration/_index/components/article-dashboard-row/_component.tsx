import { TableNameNote, TableStateCell } from '~/components/admin/admin-table'
import { StatusTag } from '~/components/status-tag'
import { StatusTagDetail } from '~/components/status-tag-detail'
import { ArticleActionDialogs } from '~/routes/administration/articles/components/article-action-dialogs'
import { ARTICLE_ACTION_LABELS } from '~/routes/administration/articles/utils/article-actions'
import { useArticleActions } from '~/routes/administration/articles/utils/use-article-actions'
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
 * An article's dashboard row (design 21a, 21b): the article list's row data
 * and actions (22a, 22b), its dialogs included.
 */
export const ArticleDashboardRow = ({
  item,
  section,
  isApprover,
  liveChange,
  now,
}: DashboardRowProps<'article'>) => {
  const { row } = item
  const actions = useArticleActions({
    article: row,
    fetcherKey: `dashboard-article-${row.id}`,
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
      type={'article'}
    >
      <DashboardRowName>
        <DashboardRowTitle isUntitled={row.isUntitled} to={item.detailHref}>
          {item.title}
        </DashboardRowTitle>
        {note !== null && <TableNameNote>{note}</TableNameNote>}
      </DashboardRowName>
      <TableStateCell>
        <StatusTag state={row.state}>
          {detail !== undefined && <StatusTagDetail>{detail}</StatusTagDetail>}
        </StatusTag>
      </TableStateCell>
      <DashboardRowActions
        editHref={actions.editHref}
        getLabel={(action) => ARTICLE_ACTION_LABELS[action]}
        isSubmitting={actions.isSubmitting}
        menu={menu}
        menuLabel={`Další akce s článkem ${item.title}`}
        onRun={actions.runAction}
        row={rowAction}
      >
        <ArticleActionDialogs
          actions={actions}
          article={row}
          canDelete={allActions.includes('delete')}
          isApprover={isApprover}
        />
      </DashboardRowActions>
    </DashboardRow>
  )
}
