import { useState } from 'react'
import { useFetcher } from 'react-router'

import { AdminSelectionBar } from '~/components/admin/admin-selection-bar'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { Button } from '~/components/button'
import { STATUS_TAG_LABELS } from '~/components/status-tag'
import { FORM_CONFIG } from '~/config/form-config'

import type { action as listAction } from '../../_action'
import type { Route } from '../../+types/route'
import { BULK_ACTION_FETCHER_KEY } from '../../utils/bulk-action-fetcher-key'
import { formatHeldSkipNote } from '../../utils/format-held-skip-note'
import type { BulkAction } from '../../utils/get-bulk-actions'
import { getBulkPublishNotes } from '../../utils/get-bulk-publish-notes'
import { getSelectionBarContent } from '../../utils/get-selection-bar-content'
import { BulkConfirmDialog } from '../bulk-confirm-dialog'
import { BulkPublishDialog } from '../bulk-publish-dialog'

type Article = Route.ComponentProps['loaderData']['articles'][number]

type Props = {
  action: string
  articles: Article[]
  onClear: () => void
  className?: string
}

const BULK_ACTION_LABELS: Record<BulkAction, string> = {
  archive: 'Archivovat…',
  delete: 'Smazat…',
  publish: 'Publikovat…',
}

const BULK_INTENTS: Record<'archive' | 'delete', string> = {
  archive: FORM_CONFIG.intent.value.bulkArchive,
  delete: FORM_CONFIG.intent.value.bulkDelete,
}

/**
 * The article list's selection bar (design 22c): the bulk actions valid for
 * every selected article, each confirmed in a dialog. The list answers the
 * result (`useBulkActionResult`).
 *
 * @param props.articles - The selected articles, in the order they were checked.
 * @param props.onClear - Clears the selection.
 */
export const ArticleSelectionBar = ({
  action,
  articles,
  onClear,
  className,
}: Props) => {
  const fetcher = useFetcher<typeof listAction>({
    key: BULK_ACTION_FETCHER_KEY,
  })
  const authenticityToken = useAuthenticityToken()
  const [openAction, setOpenAction] = useState<BulkAction | null>(null)

  const isSubmitting = fetcher.state !== 'idle'

  const { actions, message } = getSelectionBarContent(articles)

  // An article someone else edits is skipped and said apart (22f).
  const unheldArticles = articles.filter((article) => !article.isHeldByOther)
  const heldSkipNote = formatHeldSkipNote(
    articles.length - unheldArticles.length,
  )
  const onlyDrafts = unheldArticles.every(
    (article) => article.state === 'draft',
  )

  const open = (bulkAction: BulkAction) => setOpenAction(bulkAction)

  const submit = (bulkAction: 'archive' | 'delete', ids: string[]) => {
    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    formData.append(FORM_CONFIG.intent.name, BULK_INTENTS[bulkAction])
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
      {(openAction === 'archive' || openAction === 'delete') && (
        <BulkConfirmDialog
          action={openAction}
          articles={unheldArticles}
          onClose={close}
          onConfirm={() =>
            submit(
              openAction,
              unheldArticles.map((article) => article.id),
            )
          }
          onlyDrafts={onlyDrafts}
          skipped={heldSkipNote}
        />
      )}
    </>
  )
}
