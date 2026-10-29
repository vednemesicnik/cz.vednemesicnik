import { clsx } from 'clsx'

import { ActionMenu } from '~/components/action-menu'
import {
  TableActionsCell,
  TableCell,
  TableDetailsCell,
  TableDetailsLine,
  TableNameCell,
  TableRow,
  TableRowActions,
  TableRowLink,
  TableRowMenu,
  TableSelectionCell,
  TableStateCell,
} from '~/components/admin/admin-table'
import { Button } from '~/components/button'
import { LinkButton } from '~/components/link-button'
import { StatusTag } from '~/components/status-tag'
import type { LiveChange } from '~/hooks/use-live-changes'
import { ArticleActionDialogs } from '../../../components/article-action-dialogs'
import {
  ARTICLE_ACTION_LABELS,
  type ArticleAction,
} from '../../../utils/article-actions'
import { useArticleActions } from '../../../utils/use-article-actions'
import type { Route } from '../../+types/route'
import { formatArticleRowMeta } from '../../utils/format-article-row-meta'
import { formatLiveChangeLine } from '../../utils/format-live-change-line'
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
  const actions = useArticleActions({
    article,
    fetcherKey: `article-row-${article.id}`,
  })
  const { detailHref, editHref, isSubmitting, runAction } = actions

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
        disabled={article.bulkActions.length === 0}
        label={`Vybrat článek ${article.title}`}
        onChange={onSelect}
      />
      <TableNameCell>
        <TableRowLink
          className={clsx(article.isUntitled && styles.untitled)}
          to={detailHref}
        >
          {article.title}
        </TableRowLink>
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
      </TableNameCell>
      <TableCell className={styles.categoriesCell}>
        {article.categoryNames.join(', ')}
      </TableCell>
      {/* Secondary under the title's colour, unless the whole row is muted. */}
      <TableCell
        className={clsx(
          styles.tagsCell,
          article.state !== 'archived' && styles.tags,
        )}
      >
        {article.tagNames.join(', ')}
      </TableCell>
      {showAuthor && <TableCell>{article.authorNames.join(', ')}</TableCell>}
      <TableCell>{article.updatedAt}</TableCell>
      <TableStateCell>
        <StatusTag
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
      </TableStateCell>
      {meta !== null && (
        <TableDetailsCell>
          <TableDetailsLine>{meta}</TableDetailsLine>
        </TableDetailsCell>
      )}
      <TableActionsCell>
        <TableRowMenu phoneOnly={true}>
          <ActionMenu
            items={phoneMenu.map(toMenuItem)}
            label={`Další akce s článkem ${article.title}`}
            size={'sm'}
          />
        </TableRowMenu>
        <TableRowActions>
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
        </TableRowActions>

        {/* The cell aligns right and doesn't wrap; its dialogs shouldn't inherit that. */}
        <div className={styles.dialogs}>
          <ArticleActionDialogs
            actions={actions}
            article={article}
            canDelete={article.menu.includes('delete')}
            isApprover={isApprover}
          />
        </div>
      </TableActionsCell>
    </TableRow>
  )
}
