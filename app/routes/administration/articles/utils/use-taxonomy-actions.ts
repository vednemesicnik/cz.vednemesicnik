import { useMemo, useRef, useState } from 'react'
import { useFetcher, useNavigate } from 'react-router'

import { useAdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentActionResult } from '~/hooks/use-content-action-result'

import { RETURN_TO_OPENER_STATE } from './return-to-opener-state'
import {
  type ConfirmAction,
  TAXONOMY_ACTION_LABELS,
  TAXONOMY_DIRECT_INTENTS,
  type TaxonomyAction,
} from './taxonomy-actions'
import type { TaxonomyRecordCopy } from './taxonomy-record-copy'

const INTENT_VALUE = FORM_CONFIG.intent.value

type Options = {
  record: {
    name: string
    slug: string
    publishedArticleCount: number
    articleCount: number
  }
  copy: TaxonomyRecordCopy
  detailHref: string
  editHref: string
  fetcherKey: string
  deleteRedirects: boolean
}

/**
 * Runs a category's or tag's actions from its list row or its detail (design
 * 25a, 25b, 25d): state changes at once with the record's toast, Archivovat…
 * and Stáhnout z publikace… through a confirmation only when the record has
 * published articles (3vnah8ji), Smazat… through the delete dialog.
 *
 * @param options.fetcherKey - The fetcher the actions and the dialogs share.
 * @param options.deleteRedirects - Whether a delete leaves for the list, as
 *   from the detail.
 * @returns `runAction` and `getLabel` for the buttons, whether an action is
 *   running, and what `TaxonomyActionDialogs` renders.
 */
export const useTaxonomyActions = ({
  record,
  copy,
  detailHref,
  editHref,
  fetcherKey,
  deleteRedirects,
}: Options) => {
  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== 'idle'
  const authenticityToken = useAuthenticityToken()
  const navigate = useNavigate()

  // Schválit a publikovat submits the publish intent; its toast says both.
  const [submittedAction, setSubmittedAction] = useState<TaxonomyAction | null>(
    null,
  )
  const toasts = useMemo(
    () => ({
      [INTENT_VALUE.archive]: copy.toasts.archived,
      [INTENT_VALUE.publish]:
        submittedAction === 'approve-and-publish'
          ? copy.toasts.approvedAndPublished
          : copy.toasts.published,
      [INTENT_VALUE.retract]: copy.toasts.retracted,
      [INTENT_VALUE.review]: copy.toasts.approved,
      [INTENT_VALUE.submitForReview]: copy.toasts.submitted,
    }),
    [copy, submittedAction],
  )
  useContentActionResult(fetcher.data, { toasts })

  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const { openDialog: openDeleteDialog } = useAdminDeleteConfirmationDialog(
    deleteDialogRef,
    { action: detailHref, key: fetcherKey, withRedirect: deleteRedirects },
  )
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  // Archiving and retracting ask first only when readers lose something
  // (25d, 3vnah8ji); publishing never does.
  const asksFirst = (action: TaxonomyAction): action is ConfirmAction =>
    (action === 'archive' || action === 'retract') &&
    record.publishedArticleCount > 0

  const runAction = (action: TaxonomyAction) => {
    if (asksFirst(action)) {
      return setConfirmAction(action)
    }

    const intent = TAXONOMY_DIRECT_INTENTS[action]

    if (intent !== undefined) {
      setSubmittedAction(action)
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
    asksFirst(action)
      ? `${TAXONOMY_ACTION_LABELS[action]}…`
      : TAXONOMY_ACTION_LABELS[action]

  return {
    closeConfirm: () => setConfirmAction(null),
    confirmAction,
    copy,
    deleteDialogRef,
    detailHref,
    fetcherKey,
    getLabel,
    isSubmitting,
    record,
    runAction,
  }
}
