import { useRef, useState } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import {
  TableCell,
  TableRow,
  TableSelectionCell,
} from '~/components/admin/admin-table'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { BaseLink } from '~/components/base-link'
import { Button } from '~/components/button'
import { LinkButton } from '~/components/link-button'
import { StatusTag } from '~/components/status-tag'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentActionResult } from '~/hooks/use-content-action-result'
import type { action as articleAction } from '../../../article/_index/_action'
import { ArticleChangeDateDialog } from '../../../components/article-change-date-dialog'
import { ArticleMissingDialog } from '../../../components/article-missing-dialog'
import { ArticlePublishDialog } from '../../../components/article-publish-dialog'
import {
  ArticleStateDialog,
  type ArticleStateDialogKind,
} from '../../../components/article-state-dialog'
import {
  ARTICLE_ACTION_LABELS,
  ARTICLE_DIRECT_INTENTS,
  type ArticleAction,
  NOT_SUBMITTED_NOTE,
} from '../../../utils/article-actions'
import type { Route } from '../../+types/route'
import { formatArticleRowMeta } from '../../utils/format-article-row-meta'
import { formatLiveChangeLine } from '../../utils/format-live-change-line'
import type { LiveChange } from '../../utils/use-live-article-rows'
import styles from './_styles.module.css'

type Article = Route.ComponentProps['loaderData']['articles'][number]

type Props = {
  article: Article
  showAuthor: boolean
  isApprover: boolean
  selected: boolean
  onSelect: () => void
  liveChange?: LiveChange
}

/**
 * A row of the article list (design 22a, 22b): the title opening the detail
 * with its first category, the author, the last update, the state tag with one
 * fact, and one action with the rest in „⋯“. From a 1280 px table the
 * categories move from under the title into their own column, and from 1600 px
 * the tags get one too (31a). Below 768 px it folds into three
 * lines — title, state, authors · categories — with the row action first in
 * „⋯“, and the whole row opens the detail (22g). A row someone else changed
 * while the list is open is tinted for a moment and says who changed it (22f);
 * while someone edits it, it says who instead.
 */
export const ItemRow = ({
  article,
  showAuthor,
  isApprover,
  selected,
  onSelect,
  liveChange,
}: Props) => {
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

  const { closeMissingList, missingList } = useContentActionResult(fetcher.data)
  const [stateDialog, setStateDialog] = useState<ArticleStateDialogKind | null>(
    null,
  )
  const [publishDialog, setPublishDialog] = useState<{
    isApproval: boolean
  } | null>(null)

  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const [isChangeDateOpen, setIsChangeDateOpen] = useState(false)
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
      case 'retract':
      case 'archive':
        return setStateDialog(articleAction)
      case 'change-date':
        return setIsChangeDateOpen(true)
      case 'delete':
        return openDeleteDialog()
      case 'edit':
        return navigate(editHref)
      case 'view-on-web':
        if (article.slug === null) return
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
      className={styles.row}
      muted={article.state === 'archived'}
      // A tint held back for a hidden tab has none yet.
      tint={
        liveChange?.tintStartedAt == null
          ? undefined
          : {
              sequence: liveChange.sequence,
              startedAt: liveChange.tintStartedAt,
            }
      }
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
            <span className={styles.categories}>
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
      <TableCell className={styles.categoriesCell}>
        {article.categoryNames.join(', ')}
      </TableCell>
      <TableCell className={styles.tagsCell}>
        {article.tagNames.join(', ')}
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
          // Who edits it comes first: it changes what the row allows (22f).
          detail={
            article.holdLine ??
            (liveChange === undefined || liveChange.isLineSuperseded === true
              ? article.factLine
              : formatLiveChangeLine({
                  name: liveChange.name,
                  now: new Date(),
                  occurredAt: liveChange.occurredAt,
                }))
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
            <LinkButton
              disabled={isSubmitting}
              size={'sm'}
              to={editHref}
              variant={'outline'}
            >
              {ARTICLE_ACTION_LABELS.edit}
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
            <AdminDeleteConfirmationDialog
              description={'Smazání je nevratné.'}
              ref={deleteDialogRef}
              subject={article.title}
              title={
                article.state === 'archived'
                  ? 'Smazat archivovaný článek?'
                  : 'Smazat koncept?'
              }
            />
          )}
          {isChangeDateOpen && (
            <ArticleChangeDateDialog
              action={action}
              articleTitle={article.title}
              fetcherKey={fetcherKey}
              onClose={() => setIsChangeDateOpen(false)}
              publishedAt={article.publishedAt}
            />
          )}
          {stateDialog !== null && (
            <ArticleStateDialog
              action={action}
              articleTitle={article.title}
              fetcherKey={fetcherKey}
              isApprover={isApprover}
              kind={stateDialog}
              onClose={() => setStateDialog(null)}
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
