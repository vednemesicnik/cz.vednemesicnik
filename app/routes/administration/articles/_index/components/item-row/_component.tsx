import { clsx } from 'clsx'
import { useRef, useState } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import {
  TableCell,
  TableRow,
  TableSelectionCell,
} from '~/components/admin/admin-table'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { BaseLink } from '~/components/base-link'
import { Button } from '~/components/button'
import { StatusTag } from '~/components/status-tag'
import { FORM_CONFIG } from '~/config/form-config'
import type { action as articleAction } from '../../../article/_index/_action'
import { ArticleChangeDateDialog } from '../../../components/article-change-date-dialog'
import { ArticleMissingDialog } from '../../../components/article-missing-dialog'
import { ArticlePublishDialog } from '../../../components/article-publish-dialog'
import {
  ARTICLE_ACTION_LABELS,
  ARTICLE_DIRECT_INTENTS,
  type ArticleAction,
  NOT_SUBMITTED_NOTE,
} from '../../../utils/article-actions'
import { useArticleActionResult } from '../../../utils/use-article-action-result'
import type { Route } from '../../+types/route'
import { formatArticleRowMeta } from '../../utils/format-article-row-meta'
import { formatLiveChangeLine } from '../../utils/format-live-change-line'
import type { LiveChange } from '../../utils/use-live-article-rows'
import { useLiveChangeTint } from '../../utils/use-live-change-tint'
import styles from './_styles.module.css'

type Article = Route.ComponentProps['loaderData']['articles'][number]

type Props = {
  article: Article
  showAuthor: boolean
  selected: boolean
  onSelect: () => void
  liveChange?: LiveChange
}

/**
 * A row of the article list (design 22a, 22b): the title opening the detail
 * with its first category, the author, the last update, the state tag with one
 * fact, and one action with the rest in „⋯“. Below 768 px it folds into three
 * lines — title, state, authors · categories — with the row action first in
 * „⋯“, and the whole row opens the detail (22g). A row someone else changed
 * while the list is open is tinted for a moment and says who changed it (22f).
 */
export const ItemRow = ({
  article,
  showAuthor,
  selected,
  onSelect,
  liveChange,
}: Props) => {
  const { id } = article
  const action = href('/administration/articles/:articleId', { articleId: id })
  const editHref = href('/administration/articles/:articleId/edit-article', {
    articleId: id,
  })

  // The tint runs on the tab's clock, so a re-mount doesn't replay it (22f).
  const tintRef = useLiveChangeTint(liveChange?.tintStartedAt ?? null)

  const fetcherKey = `article-row-${id}`
  const fetcher = useFetcher<typeof articleAction>({ key: fetcherKey })
  const isSubmitting = fetcher.state !== 'idle'
  const authenticityToken = useAuthenticityToken()
  const navigate = useNavigate()

  const { closeMissingList, missingList } = useArticleActionResult(fetcher.data)
  const [publishDialog, setPublishDialog] = useState<{
    isApproval: boolean
  } | null>(null)

  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const changeDateDialogRef = useRef<HTMLDialogElement>(null)
  const { openDialog: openDeleteDialog } = useAdminDeleteConfirmationDialog(
    deleteDialogRef,
    { action, key: fetcherKey },
  )

  const runAction = (articleAction: ArticleAction) => {
    const intent = ARTICLE_DIRECT_INTENTS[articleAction]

    if (intent !== undefined) {
      const formData = new FormData()
      formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
      formData.append(FORM_CONFIG.intent.name, intent)
      void fetcher.submit(formData, { action, method: 'POST' })
      return
    }

    // An incomplete article answers the publish with the 23h list.
    switch (articleAction) {
      case 'approve-and-publish':
        return setPublishDialog({ isApproval: true })
      case 'publish':
        return setPublishDialog({ isApproval: false })
      case 'change-date':
        return changeDateDialogRef.current?.showModal()
      case 'delete':
        return openDeleteDialog()
      case 'edit':
        return navigate(editHref)
      case 'view-on-web':
        return window.open(
          href('/articles/:articleSlug', { articleSlug: article.slug }),
          '_blank',
          'noopener',
        )
    }
  }

  const rowAction = article.row
  const [firstCategory, ...otherCategories] = article.categoryNames
  const meta = formatArticleRowMeta({
    authorNames: article.authorNames,
    categoryNames: article.categoryNames,
    showAuthor,
  })

  const toMenuItem = (menuAction: ArticleAction) => ({
    danger: menuAction === 'delete',
    label: ARTICLE_ACTION_LABELS[menuAction],
    onSelect: () => runAction(menuAction),
  })
  // On a phone „⋯“ stands alone, the row action first in it (22g).
  const phoneMenu =
    rowAction === null ? article.menu : [rowAction, ...article.menu]

  return (
    <TableRow
      className={clsx(
        styles.row,
        // Two identical animations, so the next change restarts the tint; a
        // tint held back for a hidden tab has none yet.
        liveChange?.tintStartedAt != null &&
          (liveChange.sequence % 2 === 0
            ? styles.liveChangeEven
            : styles.liveChangeOdd),
      )}
      muted={article.state === 'archived'}
      ref={tintRef}
    >
      <TableSelectionCell
        checked={selected}
        className={styles.wideOnly}
        disabled={article.bulkActions.length === 0}
        label={`Vybrat článek ${article.title}`}
        onChange={onSelect}
      />
      <TableCell className={styles.titleCell}>
        {/* Zobrazit is gone: the title opens the detail (22a). */}
        <span className={styles.title}>
          <BaseLink className={styles.link} to={action}>
            {article.title}
          </BaseLink>
          {firstCategory !== undefined && (
            <span
              className={styles.categories}
              title={article.categoryNames.join(', ')}
            >
              {firstCategory}
              {otherCategories.length > 0 && (
                <span className={styles.more}>
                  {` +${otherCategories.length}`}
                </span>
              )}
            </span>
          )}
        </span>
      </TableCell>
      {showAuthor && (
        <TableCell className={styles.wideOnly}>
          {article.authorNames.join(', ')}
        </TableCell>
      )}
      <TableCell className={styles.wideOnly}>{article.updatedAt}</TableCell>
      <TableCell className={styles.stateCell}>
        <StatusTag
          className={styles.state}
          detail={
            liveChange === undefined
              ? article.factLine
              : formatLiveChangeLine({
                  name: liveChange.name,
                  now: new Date(),
                  occurredAt: liveChange.occurredAt,
                })
          }
          state={article.state}
        />
      </TableCell>
      {meta !== null && (
        <TableCell className={styles.metaCell}>{meta}</TableCell>
      )}
      <TableCell className={styles.actionsCell} variant={'actions'}>
        <ActionMenu
          className={styles.phoneMenu}
          items={phoneMenu.map(toMenuItem)}
          label={`Další akce s článkem ${article.title}`}
          size={'sm'}
        />
        <span className={styles.actions}>
          {rowAction === 'edit' && (
            <AdminLinkButton
              className={styles.editLink}
              disabled={isSubmitting}
              to={editHref}
            >
              {ARTICLE_ACTION_LABELS.edit}
            </AdminLinkButton>
          )}
          {rowAction !== null && rowAction !== 'edit' && (
            <Button
              disabled={isSubmitting}
              onClick={() => runAction(rowAction)}
              size={'sm'}
              type={'button'}
              variant={'outline'}
            >
              {ARTICLE_ACTION_LABELS[rowAction]}
            </Button>
          )}
          <ActionMenu
            items={article.menu.map(toMenuItem)}
            label={`Další akce s článkem ${article.title}`}
            size={'sm'}
          />
        </span>

        {/* The cell aligns right and doesn't wrap; its dialogs shouldn't inherit that. */}
        <div className={styles.dialogs}>
          {article.menu.includes('delete') && (
            <AdminDeleteConfirmationDialog ref={deleteDialogRef} />
          )}
          {article.menu.includes('change-date') && (
            <ArticleChangeDateDialog
              action={action}
              fetcherKey={fetcherKey}
              publishedAt={article.publishedAt}
              ref={changeDateDialogRef}
            />
          )}
          {publishDialog !== null && (
            <ArticlePublishDialog
              action={action}
              articleTitle={article.title}
              authorNames={article.authorNames}
              fetcherKey={fetcherKey}
              isApproval={publishDialog.isApproval}
              note={article.isNotSubmitted ? NOT_SUBMITTED_NOTE : null}
              onClose={() => setPublishDialog(null)}
              originalPublishedAt={article.publishedAt}
            />
          )}
          {missingList !== null && (
            <ArticleMissingDialog
              editHref={editHref}
              missingList={missingList}
              onClose={closeMissingList}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
