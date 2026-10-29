import { href } from 'react-router'

import { CATEGORY_RECORD_COPY } from '~/routes/administration/articles/categories/category-record-copy'
import { TaxonomyActionDialogs } from '~/routes/administration/articles/components/taxonomy-action-dialogs'
import { TAG_RECORD_COPY } from '~/routes/administration/articles/tags/tag-record-copy'
import { useTaxonomyActions } from '~/routes/administration/articles/utils/use-taxonomy-actions'
import { getRowTint } from '~/utils/live-change/get-row-tint'
import { SECTION_ROW_ACTION } from '../../dashboard-section-kind'
import { DASHBOARD_TYPE_COPY } from '../../dashboard-types'
import { getDashboardRowActions } from '../../utils/get-dashboard-row-actions'
import { getDashboardRowLines } from '../../utils/get-dashboard-row-lines'
import { DashboardRow } from '../dashboard-row'
import type { DashboardRowProps } from '../dashboard-row/dashboard-row-props'
import { DashboardRowActions } from '../dashboard-row-actions'

/**
 * A category's or tag's dashboard row (design 21a, 21b): the list's row data
 * and actions (25a, 25e), its dialogs included.
 */
export const TaxonomyDashboardRow = ({
  item,
  section,
  liveChange,
  now,
}: DashboardRowProps<'category' | 'tag'>) => {
  const { row } = item
  const isCategory = item.type === 'category'
  const copy = isCategory ? CATEGORY_RECORD_COPY : TAG_RECORD_COPY
  const actions = useTaxonomyActions({
    copy,
    deleteRedirects: false,
    detailHref: item.detailHref,
    editHref: isCategory
      ? href('/administration/articles/categories/:categoryId/edit', {
          categoryId: row.id,
        })
      : href('/administration/articles/tags/:tagId/edit', { tagId: row.id }),
    fetcherKey: `dashboard-${item.type}-${row.id}`,
    record: row,
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
      state={row.state}
      tint={getRowTint(liveChange)}
      title={item.title}
      typeLabel={DASHBOARD_TYPE_COPY[item.type].label}
    >
      <DashboardRowActions
        getLabel={actions.getLabel}
        isSubmitting={actions.isSubmitting}
        menu={menu}
        menuLabel={copy.menuLabel(item.title)}
        onRun={actions.runAction}
        row={rowAction}
      >
        <TaxonomyActionDialogs
          actions={actions}
          canDelete={allActions.includes('delete')}
        />
      </DashboardRowActions>
    </DashboardRow>
  )
}
