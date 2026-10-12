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
import styles from './_styles.module.css'

type Article = Route.ComponentProps['loaderData']['articles'][number]

type Props = {
  article: Article
  showAuthor: boolean
  selected: boolean
  onSelect: () => void
}

/**
 * A row of the article list (design 22a, 22b): the title opening the detail
 * with its first category, the author, the last update, the state tag with one
 * fact, and one action with the rest in „⋯“.
 */
export const ItemRow = ({ article, showAuthor, selected, onSelect }: Props) => {
  const { id } = article
  const action = href('/administration/articles/:articleId', { articleId: id })
  const editHref = href('/administration/articles/:articleId/edit-article', {
    articleId: id,
  })

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

  return (
    <TableRow muted={article.state === 'archived'}>
      <TableSelectionCell
        checked={selected}
        disabled={!article.canDelete}
        label={`Vybrat článek ${article.title}`}
        onChange={onSelect}
      />
      <TableCell>
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
      {showAuthor && <TableCell>{article.authorNames.join(', ')}</TableCell>}
      <TableCell>{article.updatedAt}</TableCell>
      <TableCell>
        <StatusTag detail={article.factLine} state={article.state} />
      </TableCell>
      <TableCell variant={'actions'}>
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
            items={article.menu.map((menuAction) => ({
              danger: menuAction === 'delete',
              label: ARTICLE_ACTION_LABELS[menuAction],
              onSelect: () => runAction(menuAction),
            }))}
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
