import { ActionMenu } from '~/components/action-menu'
import {
  TableCell,
  TableRow,
  type TableRowTint,
  TableSelectionCell,
} from '~/components/admin/admin-table'
import { BaseLink } from '~/components/base-link'
import { Button } from '~/components/button'
import { LinkButton } from '~/components/link-button'
import { StatusTag, type StatusTagState } from '~/components/status-tag'

import { RETURN_TO_OPENER_STATE } from '../../utils/return-to-opener-state'
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
  canDelete: boolean
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
 * with the rest in „⋯“, as the article's row (22a).
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

  return (
    <TableRow muted={record.state === 'archived'} tint={tint}>
      <TableSelectionCell
        checked={selected}
        disabled={!record.canDelete}
        label={copy.selectLabel(record.name)}
        onChange={onSelect}
      />
      <TableCell>
        {/* Zobrazit is gone: the name opens the detail (22a). */}
        <span className={styles.name}>
          <BaseLink className={styles.link} to={detailHref}>
            {record.name}
          </BaseLink>
          {showSlug && <span className={styles.slug}>{record.slug}</span>}
        </span>
      </TableCell>
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
      <TableCell>
        <StatusTag detail={record.factLine ?? undefined} state={record.state} />
      </TableCell>
      <TableCell variant={'actions'}>
        <span className={styles.actions}>
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
              items={record.menu.map((menuAction) => ({
                danger: menuAction === 'delete',
                label: getLabel(menuAction),
                onSelect: () => runAction(menuAction),
              }))}
              label={copy.menuLabel(record.name)}
              size={'sm'}
            />
          )}
        </span>

        {/* The cell aligns right and doesn't wrap; its dialogs shouldn't inherit that. */}
        <div className={styles.dialogs}>
          <TaxonomyActionDialogs
            actions={actions}
            canDelete={record.menu.includes('delete')}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}
