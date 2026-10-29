import { useRef, useState } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { useAdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentActionResult } from '~/hooks/use-content-action-result'

import type { action as articleAction } from '../article/_index/_action'
import type { ArticleStateDialogKind } from '../components/article-state-dialog'
import { ARTICLE_DIRECT_INTENTS, type ArticleAction } from './article-actions'

type Options = {
  article: {
    id: string
    slug: string | null
  }
  fetcherKey: string
}

/**
 * Runs an article's actions from its row (design 22a, 22b, 07c): a state
 * change at once, Publikovat…, Stáhnout z publikace…, Archivovat…, Změnit
 * datum… and Smazat… through their dialogs, and what an incomplete article
 * lacks (23h).
 *
 * @param options.article - The article's id and its address.
 * @param options.fetcherKey - The fetcher the actions and the dialogs share.
 * @returns `runAction`, whether an action is running, and what
 *   `ArticleActionDialogs` renders.
 */
export const useArticleActions = ({ article, fetcherKey }: Options) => {
  const detailHref = href('/administration/articles/:articleId', {
    articleId: article.id,
  })
  const editHref = href('/administration/articles/:articleId/edit-article', {
    articleId: article.id,
  })

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
    { action: detailHref, key: fetcherKey },
  )

  const runAction = (action: ArticleAction) => {
    const intent = ARTICLE_DIRECT_INTENTS[action]

    if (intent !== undefined) {
      const formData = new FormData()
      formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
      formData.append(FORM_CONFIG.intent.name, intent)
      void fetcher.submit(formData, { action: detailHref, method: 'POST' })
      return
    }

    // An incomplete article answers the publish with the 23h list.
    switch (action) {
      case 'approve-and-publish':
        return setPublishDialog({ isApproval: true })
      case 'publish':
        return setPublishDialog({ isApproval: false })
      case 'retract':
      case 'archive':
        return setStateDialog(action)
      case 'change-date':
        return setIsChangeDateOpen(true)
      case 'delete':
        return openDeleteDialog()
      case 'edit':
        return navigate(editHref)
      case 'view-on-web':
        if (article.slug === null) return
        // Only a published address is unique: the id says which draft to
        // show (log 0039).
        return window.open(
          `${href('/articles/:articleSlug', { articleSlug: article.slug })}?id=${article.id}`,
          '_blank',
          'noopener',
        )
    }
  }

  return {
    closeChangeDate: () => setIsChangeDateOpen(false),
    closeMissingList,
    closePublishDialog: () => setPublishDialog(null),
    closeStateDialog: () => setStateDialog(null),
    deleteDialogRef,
    detailHref,
    editHref,
    fetcherKey,
    isChangeDateOpen,
    isSubmitting,
    missingList,
    publishDialog,
    runAction,
    stateDialog,
  }
}
