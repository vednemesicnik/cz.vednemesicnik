import { useEffect, useRef, useState } from 'react'
import { useFetcher } from 'react-router'

import { AdminSelectionBar } from '~/components/admin/admin-selection-bar'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { Button } from '~/components/button'
import { STATUS_TAG_LABELS } from '~/components/status-tag'
import { useToast } from '~/components/toast-provider'
import { FORM_CONFIG } from '~/config/form-config'

import type { action as listAction } from '../../_action'
import type { Route } from '../../+types/route'
import { formatBulkActionToast } from '../../utils/format-bulk-action-toast'
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

const FETCHER_KEY = 'articles-bulk-action'

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
 * every selected article, each confirmed in a dialog, then a toast with the
 * real result and a cleared selection.
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
  const fetcher = useFetcher<typeof listAction>({ key: FETCHER_KEY })
  const authenticityToken = useAuthenticityToken()
  const showToast = useToast()
  const [openAction, setOpenAction] = useState<BulkAction | null>(null)

  const isSubmitting = fetcher.state !== 'idle'
  const onlyDrafts = articles.every((article) => article.state === 'draft')
  const onlyDraftsRef = useRef(onlyDrafts)
  // A keyed fetcher keeps its data across remounts; answer only a new result.
  const handledResultRef = useRef(fetcher.data)

  useEffect(() => {
    const result = fetcher.data
    if (
      fetcher.state !== 'idle' ||
      result === undefined ||
      result === handledResultRef.current
    ) {
      return
    }
    handledResultRef.current = result

    showToast(
      formatBulkActionToast({
        ...result,
        onlyDrafts: onlyDraftsRef.current,
      }),
    )
    onClear()
  }, [fetcher.data, fetcher.state, onClear, showToast])

  const { actions, message } = getSelectionBarContent(articles)

  const open = (bulkAction: BulkAction) => {
    onlyDraftsRef.current = onlyDrafts
    setOpenAction(bulkAction)
  }

  const submit = (bulkAction: 'archive' | 'delete', ids: string[]) => {
    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    formData.append(FORM_CONFIG.intent.name, BULK_INTENTS[bulkAction])
    for (const id of ids) formData.append('ids', id)
    void fetcher.submit(formData, { action, method: 'POST' })
  }

  const close = () => setOpenAction(null)

  // Incomplete articles are left out of publishing and said apart (23h).
  const completeArticles = articles.filter((article) => !article.isIncomplete)
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
          fetcherKey={FETCHER_KEY}
          keptArticles={completeArticles.flatMap((article) =>
            article.publishedAt === null
              ? []
              : [{ ...toListItem(article), publishedAt: article.publishedAt }],
          )}
          onClose={close}
          orderedArticles={completeArticles
            .filter((article) => article.publishedAt === null)
            .map(toListItem)}
          {...getBulkPublishNotes({
            incompleteCount: articles.length - completeArticles.length,
            notSubmittedCount: completeArticles.filter(
              (article) => article.isNotSubmitted,
            ).length,
            pendingCount: completeArticles.filter(
              (article) => article.state === 'pending',
            ).length,
          })}
        />
      )}
      {(openAction === 'archive' || openAction === 'delete') && (
        <BulkConfirmDialog
          action={openAction}
          articles={articles}
          onClose={close}
          onConfirm={() =>
            submit(
              openAction,
              articles.map((article) => article.id),
            )
          }
          onlyDrafts={onlyDrafts}
        />
      )}
    </>
  )
}
