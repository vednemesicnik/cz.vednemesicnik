import type { ContentState } from '@generated/prisma/enums'

import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'

import { NOT_SUBMITTED_NOTE } from '../../utils/article-actions'
import type { useArticleActions } from '../../utils/use-article-actions'
import { ArticleChangeDateDialog } from '../article-change-date-dialog'
import { ArticleMissingDialog } from '../article-missing-dialog'
import { ArticlePublishDialog } from '../article-publish-dialog'
import { ArticleStateDialog } from '../article-state-dialog'

type Props = {
  actions: ReturnType<typeof useArticleActions>
  article: {
    title: string
    state: ContentState | 'pending' | 'approved'
    authorNames: string[]
    publishedAt: string | null
    isNotSubmitted: boolean
  }
  canDelete: boolean
  isApprover: boolean
}

/**
 * The dialogs of an article's row actions (design 22b, 23d, 23f, 23h):
 * Smazat…, Změnit datum…, Stáhnout z publikace… or Archivovat…, Publikovat…
 * and what an incomplete article lacks.
 *
 * @param props.actions - The article's `useArticleActions`.
 * @param props.article - What the dialogs say about it.
 * @param props.canDelete - Whether Smazat… is offered, so its dialog exists.
 * @param props.isApprover - Whether the signed-in author is the Coordinator.
 */
export const ArticleActionDialogs = ({
  actions,
  article,
  canDelete,
  isApprover,
}: Props) => (
  <>
    {canDelete && (
      <AdminDeleteConfirmationDialog
        description={'Smazání je nevratné.'}
        ref={actions.deleteDialogRef}
        subject={article.title}
        title={
          article.state === 'archived'
            ? 'Smazat archivovaný článek?'
            : 'Smazat koncept?'
        }
      />
    )}
    {actions.isChangeDateOpen && (
      <ArticleChangeDateDialog
        action={actions.detailHref}
        fetcherKey={actions.fetcherKey}
        onClose={actions.closeChangeDate}
        publishedAt={article.publishedAt}
        title={article.title}
      />
    )}
    {actions.stateDialog !== null && (
      <ArticleStateDialog
        action={actions.detailHref}
        articleTitle={article.title}
        fetcherKey={actions.fetcherKey}
        isApprover={isApprover}
        kind={actions.stateDialog}
        onClose={actions.closeStateDialog}
      />
    )}
    {actions.publishDialog !== null && (
      <ArticlePublishDialog
        action={actions.detailHref}
        articleTitle={article.title}
        authorNames={article.authorNames}
        fetcherKey={actions.fetcherKey}
        isApproval={actions.publishDialog.isApproval}
        note={article.isNotSubmitted ? NOT_SUBMITTED_NOTE : null}
        onClose={actions.closePublishDialog}
        originalPublishedAt={article.publishedAt}
      />
    )}
    {actions.missingList !== null && (
      <ArticleMissingDialog
        editHref={actions.editHref}
        missingList={actions.missingList}
        onClose={actions.closeMissingList}
      />
    )}
  </>
)
