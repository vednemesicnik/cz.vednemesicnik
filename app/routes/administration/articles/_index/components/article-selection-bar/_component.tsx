import { useState } from 'react'
import { useFetcher } from 'react-router'

import { AdminSelectionBar } from '~/components/admin/admin-selection-bar'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { BulkConfirmDialog } from '~/components/bulk-confirm-dialog'
import { Button } from '~/components/button'
import { STATUS_TAG_LABELS } from '~/components/status-tag'
import { BULK_ACTION_INTENTS } from '~/config/bulk-action-intents'
import { BULK_ACTION_LABELS } from '~/config/bulk-action-labels'
import { ARTICLE_BULK_NOUN } from '~/config/bulk-noun-config'
import { FORM_CONFIG } from '~/config/form-config'
import type { BulkActionResult } from '~/utils/bulk-action/bulk-action-result'
import { formatHeldSkipNote } from '~/utils/bulk-action/format-held-skip-note'
import type { BulkAction } from '~/utils/bulk-action/get-bulk-actions'
import { getBulkPublishNotes } from '~/utils/bulk-action/get-bulk-publish-notes'
import { getSelectionBarContent } from '~/utils/bulk-action/get-selection-bar-content'

import type { Route } from '../../+types/route'
import { BULK_ACTION_FETCHER_KEY } from '../../utils/bulk-action-fetcher-key'
import { BulkPublishDialog } from '../bulk-publish-dialog'

type Article = Route.ComponentProps['loaderData']['articles'][number]

type Props = {
  action: string
  articles: Article[]
  isCreator: boolean
  onClear: () => void
  className?: string
}

/**
 * The article list's selection bar (design 22c): the bulk actions valid for
 * every selected article, each confirmed in a dialog. The list answers the
 * result (`useBulkActionResult`).
 *
 * @param props.articles - The selected articles, in the order they were checked.
 * @param props.isCreator - A Creator selects: retracting says who publishes
 *   again.
 * @param props.onClear - Clears the selection.
 */
export const ArticleSelectionBar = ({
  action,
  articles,
  isCreator,
  onClear,
  className,
}: Props) => {
  const fetcher = useFetcher<BulkActionResult>({
    key: BULK_ACTION_FETCHER_KEY,
  })
  const authenticityToken = useAuthenticityToken()
  const [openAction, setOpenAction] = useState<BulkAction | null>(null)

  const isSubmitting = fetcher.state !== 'idle'

  const { actions, message } = getSelectionBarContent(
    articles,
    ARTICLE_BULK_NOUN,
  )

  // An article someone else edits is skipped and said apart (22f).
  const unheldArticles = articles.filter((article) => !article.isHeldByOther)
  const heldSkipNote = formatHeldSkipNote(
    articles.length - unheldArticles.length,
    ARTICLE_BULK_NOUN,
  )
  const onlyDrafts = unheldArticles.every(
    (article) => article.state === 'draft',
  )

  const open = (bulkAction: BulkAction) => setOpenAction(bulkAction)

  const submit = (bulkAction: BulkAction, ids: string[]) => {
    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    formData.append(FORM_CONFIG.intent.name, BULK_ACTION_INTENTS[bulkAction])
    for (const id of ids) formData.append('ids', id)
    void fetcher.submit(formData, { action, method: 'POST' })
  }

  const close = () => setOpenAction(null)

  // Incomplete articles are left out of publishing and said apart (23h).
  const completeArticles = unheldArticles.filter(
    (article) => !article.isIncomplete,
  )
  const publishNotes = getBulkPublishNotes({
    incompleteCount: unheldArticles.length - completeArticles.length,
    notSubmittedCount: completeArticles.filter(
      (article) => article.isNotSubmitted,
    ).length,
    noun: ARTICLE_BULK_NOUN,
    pendingCount: completeArticles.filter(
      (article) => article.state === 'pending',
    ).length,
  })
  const publishSkipped = [publishNotes.skipped, heldSkipNote]
    .filter((sentence) => sentence !== null)
    .join(' ')
  const toListItem = (article: Article) => ({
    detail: STATUS_TAG_LABELS[article.state],
    id: article.id,
    title: article.title,
  })

  return (
    <>
      <AdminSelectionBar
        className={className}
        count={articles.length}
        message={message}
        onClear={onClear}
      >
        {actions.map((bulkAction) => (
          <Button
            disabled={isSubmitting}
            key={bulkAction}
            onClick={() => open(bulkAction)}
            size={'sm'}
            type={'button'}
            variant={'outline'}
          >
            {BULK_ACTION_LABELS[bulkAction]}
          </Button>
        ))}
      </AdminSelectionBar>

      {openAction === 'publish' && (
        <BulkPublishDialog
          action={action}
          fetcherKey={BULK_ACTION_FETCHER_KEY}
          keptArticles={completeArticles.flatMap((article) =>
            article.publishedAt === null
              ? []
              : [{ ...toListItem(article), publishedAt: article.publishedAt }],
          )}
          notes={publishNotes.notes}
          onClose={close}
          orderedArticles={completeArticles
            .filter((article) => article.publishedAt === null)
            .map(toListItem)}
          skipped={publishSkipped === '' ? null : publishSkipped}
        />
      )}
      {openAction !== null && openAction !== 'publish' && (
        <BulkConfirmDialog
          action={openAction}
          isCreator={isCreator}
          noun={ARTICLE_BULK_NOUN}
          onClose={close}
          onConfirm={() =>
            submit(
              openAction,
              unheldArticles.map((article) => article.id),
            )
          }
          onlyDrafts={onlyDrafts}
          records={unheldArticles}
          skipped={heldSkipNote}
        />
      )}
    </>
  )
}
