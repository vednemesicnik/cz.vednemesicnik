import { ActionMenu } from '~/components/action-menu'
import {
  TableActionsCell,
  TableCell,
  TableDetailsCell,
  TableDetailsLine,
  TableNameAddress,
  TableNameCell,
  TableRow,
  TableRowActions,
  TableRowLink,
  TableRowMenu,
  type TableRowTint,
  TableSelectionCell,
  TableStateCell,
} from '~/components/admin/admin-table'
import { BaseLink } from '~/components/base-link'
import { Button } from '~/components/button'
import { LinkButton } from '~/components/link-button'
import { StatusTag, type StatusTagState } from '~/components/status-tag'
import type { BulkAction } from '~/utils/bulk-action/get-bulk-actions'

import { RETURN_TO_OPENER_STATE } from '~/utils/return-to-opener-state'
import { formatPublishedArticleCount } from '../../utils/format-published-article-count'
import {
  TAXONOMY_ACTION_LABELS,
  type TaxonomyAction,
} from '../../utils/taxonomy-actions'
import type { TaxonomyRecordCopy } from '../../utils/taxonomy-record-copy'
import { useTaxonomyActions } from '../../utils/use-taxonomy-actions'
import { TaxonomyActionDialogs } from '../taxonomy-action-dialogs'
import styles from './_styles.module.css'

type TaxonomyRecord = {
  id: string
  name: string
  slug: string
  state: StatusTagState
  factLine: string | null
  publishedArticleCount: number
  articleCount: number
  row: TaxonomyAction | null
  menu: TaxonomyAction[]
  bulkActions: BulkAction[]
}

type Props = {
  record: TaxonomyRecord
  copy: TaxonomyRecordCopy
  detailHref: string
  editHref: string
  publishedArticlesHref: string
  showSlug: boolean
  selected: boolean
  onSelect: () => void
  tint?: TableRowTint
}

/**
 * A row of the category or tag list (design 25a, 25e): the name opening the
 * detail, for a category with its address under it; the published articles
 * linking to the article list; the state tag with one fact; and one action
 * with the rest in „⋯“, as the article's row (22a). Below 768 px it folds
 * into the name, the state and the published articles in words, beside one
 * „⋯“ with the row action first (32a).
 *
 * @param props.publishedArticlesHref - The article list filtered to the record
 *   and `state=published`, the set the count counts.
 * @param props.showSlug - The address under the name; a tag's almost always
 *   repeats its name (25e).
 */
export const TaxonomyItemRow = ({
  record,
  copy,
  detailHref,
  editHref,
  publishedArticlesHref,
  showSlug,
  selected,
  onSelect,
  tint,
}: Props) => {
  const actions = useTaxonomyActions({
    copy,
    deleteRedirects: false,
    detailHref,
    editHref,
    fetcherKey: `taxonomy-row-${record.id}`,
    record,
  })
  const { getLabel, isSubmitting, runAction } = actions

  const rowAction = record.row
  const toMenuItem = (menuAction: TaxonomyAction) => ({
    danger: menuAction === 'delete',
    label: getLabel(menuAction),
    onSelect: () => runAction(menuAction),
  })
  // On a phone „⋯“ stands alone, the row action first in it (32a).
  const phoneMenu =
    rowAction === null ? record.menu : [rowAction, ...record.menu]

  return (
    <TableRow muted={record.state === 'archived'} tint={tint}>
      <TableSelectionCell
        checked={selected}
        disabled={record.bulkActions.length === 0}
        label={copy.selectLabel(record.name)}
        onChange={onSelect}
      />
      <TableNameCell>
        <TableRowLink to={detailHref}>{record.name}</TableRowLink>
        {showSlug && <TableNameAddress>{record.slug}</TableNameAddress>}
      </TableNameCell>
      <TableCell>
        {/* Zero is tertiary and leads nowhere (25a). */}
        {record.publishedArticleCount === 0 ? (
          <span className={styles.zero}>0</span>
        ) : (
          <BaseLink className={styles.count} to={publishedArticlesHref}>
            {record.publishedArticleCount.toLocaleString('cs-CZ')}
          </BaseLink>
        )}
      </TableCell>
      <TableStateCell>
        <StatusTag detail={record.factLine ?? undefined} state={record.state} />
      </TableStateCell>
      <TableDetailsCell>
        <TableDetailsLine>
          {formatPublishedArticleCount(record.publishedArticleCount)}
        </TableDetailsLine>
      </TableDetailsCell>
      <TableActionsCell>
        {phoneMenu.length > 0 && (
          <TableRowMenu phoneOnly={true}>
            <ActionMenu
              items={phoneMenu.map(toMenuItem)}
              label={copy.menuLabel(record.name)}
              size={'sm'}
            />
          </TableRowMenu>
        )}
        <TableRowActions>
          {rowAction === 'edit' && (
            <LinkButton
              disabled={isSubmitting}
              size={'sm'}
              state={RETURN_TO_OPENER_STATE}
              to={editHref}
              variant={'outline'}
            >
              {TAXONOMY_ACTION_LABELS.edit}
            </LinkButton>
          )}
          {rowAction !== null && rowAction !== 'edit' && (
            <Button
              disabled={isSubmitting}
              onClick={() => runAction(rowAction)}
              size={'sm'}
              type={'button'}
              variant={'outline'}
            >
              {getLabel(rowAction)}
            </Button>
          )}
          {record.menu.length > 0 && (
            <ActionMenu
              items={record.menu.map(toMenuItem)}
              label={copy.menuLabel(record.name)}
              size={'sm'}
            />
          )}
        </TableRowActions>

        {/* The cell aligns right and doesn't wrap; its dialogs shouldn't inherit that. */}
        <div className={styles.dialogs}>
          <TaxonomyActionDialogs
            actions={actions}
            canDelete={record.menu.includes('delete')}
          />
        </div>
      </TableActionsCell>
    </TableRow>
  )
}
