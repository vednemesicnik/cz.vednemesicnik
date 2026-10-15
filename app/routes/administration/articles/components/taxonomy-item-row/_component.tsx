import { useMemo, useRef, useState } from 'react'
import { useFetcher, useNavigate } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import {
  TableCell,
  TableRow,
  type TableRowTint,
  TableSelectionCell,
} from '~/components/admin/admin-table'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { BaseLink } from '~/components/base-link'
import { Button } from '~/components/button'
import { LinkButton } from '~/components/link-button'
import { StatusTag, type StatusTagState } from '~/components/status-tag'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentActionResult } from '~/hooks/use-content-action-result'

import { RETURN_TO_OPENER_STATE } from '../../utils/return-to-opener-state'
import {
  TAXONOMY_ACTION_LABELS,
  TAXONOMY_DIRECT_INTENTS,
  type TaxonomyAction,
} from '../../utils/taxonomy-actions'
import type { TaxonomyRecordCopy } from '../../utils/taxonomy-record-copy'
import { TaxonomyArchiveDialog } from '../taxonomy-archive-dialog'
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

const INTENT_VALUE = FORM_CONFIG.intent.value

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
  const fetcherKey = `taxonomy-row-${record.id}`
  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== 'idle'
  const authenticityToken = useAuthenticityToken()
  const navigate = useNavigate()

  const toasts = useMemo(
    () => ({
      [INTENT_VALUE.archive]: copy.toasts.archived,
      [INTENT_VALUE.publish]: copy.toasts.published,
      [INTENT_VALUE.review]: copy.toasts.approved,
      [INTENT_VALUE.submitForReview]: copy.toasts.submitted,
    }),
    [copy],
  )
  useContentActionResult(fetcher.data, toasts)

  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const { openDialog: openDeleteDialog } = useAdminDeleteConfirmationDialog(
    deleteDialogRef,
    { action: detailHref, key: fetcherKey },
  )
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)

  // Archiving asks first only when readers lose something (25d).
  const asksBeforeArchive = record.publishedArticleCount > 0

  const runAction = (action: TaxonomyAction) => {
    if (action === 'archive' && asksBeforeArchive) {
      return setIsArchiveDialogOpen(true)
    }

    const intent = TAXONOMY_DIRECT_INTENTS[action]

    if (intent !== undefined) {
      const formData = new FormData()
      formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
      formData.append(FORM_CONFIG.intent.name, intent)
      void fetcher.submit(formData, { action: detailHref, method: 'POST' })
      return
    }

    switch (action) {
      case 'delete':
        return openDeleteDialog()
      case 'edit':
        return navigate(editHref, { state: RETURN_TO_OPENER_STATE })
      case 'view-on-web':
        return window.open(
          `${copy.publicPath}/${record.slug}`,
          '_blank',
          'noopener',
        )
    }
  }

  const getLabel = (action: TaxonomyAction) =>
    action === 'archive' && asksBeforeArchive
      ? `${TAXONOMY_ACTION_LABELS.archive}…`
      : TAXONOMY_ACTION_LABELS[action]

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
          {record.menu.includes('delete') && (
            <AdminDeleteConfirmationDialog
              description={copy.deleteDescription(record.articleCount)}
              ref={deleteDialogRef}
              title={copy.deleteTitle(record.name)}
            />
          )}
          {isArchiveDialogOpen && (
            <TaxonomyArchiveDialog
              action={detailHref}
              description={copy.archiveDescription}
              fetcherKey={fetcherKey}
              onClose={() => setIsArchiveDialogOpen(false)}
              title={copy.archiveTitle(record.name)}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
