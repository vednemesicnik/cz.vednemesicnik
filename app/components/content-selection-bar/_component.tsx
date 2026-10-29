import type { ContentState } from '@generated/prisma/enums'
import { clsx } from 'clsx'
import { useState } from 'react'
import { useFetcher } from 'react-router'

import { AdminSelectionBar } from '~/components/admin/admin-selection-bar'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { BulkConfirmDialog } from '~/components/bulk-confirm-dialog'
import { Button } from '~/components/button'
import { BULK_ACTION_INTENTS } from '~/config/bulk-action-intents'
import { BULK_ACTION_LABELS } from '~/config/bulk-action-labels'
import type { BulkNoun } from '~/config/bulk-noun-config'
import { FORM_CONFIG } from '~/config/form-config'
import type { BulkActionResult } from '~/utils/bulk-action/bulk-action-result'
import { formatHeldSkipNote } from '~/utils/bulk-action/format-held-skip-note'
import type { BulkAction } from '~/utils/bulk-action/get-bulk-actions'
import { getBulkPublishNotes } from '~/utils/bulk-action/get-bulk-publish-notes'
import { getSelectionBarContent } from '~/utils/bulk-action/get-selection-bar-content'

import styles from './_styles.module.css'

/** A selected record as the bar reads it; `title` is how the dialog lists it. */
export type SelectedContent = {
  id: string
  title: string
  state: ContentState | 'pending' | 'approved'
  bulkActions: BulkAction[]
  isHeldByOther: boolean
  isIncomplete: boolean
  isNotSubmitted: boolean
}

type Props = {
  action: string
  fetcherKey: string
  noun: BulkNoun
  records: SelectedContent[]
  isCreator: boolean
  onClear: () => void
  className?: string
}

/**
 * The selection bar of a list that publishes without an order or a date
 * (design 22c, 25g, 26f, 27a): the bulk actions valid for every selected
 * record, each confirmed in one dialog. A record someone else edits is skipped
 * and said apart (22f); publishing skips an incomplete one too (23h, 26e). The
 * list answers the result (`useBulkActionResult`).
 *
 * @param props.action - The list's action the bar posts to.
 * @param props.fetcherKey - The keyed fetcher the list answers through.
 * @param props.noun - The list's bulk noun.
 * @param props.records - The selected records, in the list's order.
 * @param props.isCreator - A Creator selects: retracting says who publishes
 *   again.
 * @param props.onClear - Clears the selection.
 */
export const ContentSelectionBar = ({
  action,
  fetcherKey,
  noun,
  records,
  isCreator,
  onClear,
  className,
}: Props) => {
  const fetcher = useFetcher<BulkActionResult>({ key: fetcherKey })
  const authenticityToken = useAuthenticityToken()
  const [openAction, setOpenAction] = useState<BulkAction | null>(null)

  const isSubmitting = fetcher.state !== 'idle'

  const { actions, message } = getSelectionBarContent(records, noun)

  const unheldRecords = records.filter((record) => !record.isHeldByOther)
  const heldSkipNote = formatHeldSkipNote(
    records.length - unheldRecords.length,
    noun,
  )
  const onlyDrafts = unheldRecords.every((record) => record.state === 'draft')

  // Publishing leaves out the incomplete ones too and says so (23h, 26e).
  const completeRecords = unheldRecords.filter((record) => !record.isIncomplete)
  const publishNotes = getBulkPublishNotes({
    incompleteCount: unheldRecords.length - completeRecords.length,
    notSubmittedCount: completeRecords.filter((record) => record.isNotSubmitted)
      .length,
    noun,
    pendingCount: completeRecords.filter((record) => record.state === 'pending')
      .length,
  })

  // Publishing, the exceptions stand in one paragraph in full ink (26f).
  const publishSentence = [
    publishNotes.notes,
    publishNotes.skipped,
    heldSkipNote,
  ]
    .filter((sentence) => sentence !== null)
    .join(' ')
  const publishExceptions = publishSentence === '' ? [] : [publishSentence]

  const isPublishing = openAction === 'publish'
  const confirmedRecords = isPublishing ? completeRecords : unheldRecords

  const submit = (bulkAction: BulkAction) => {
    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    formData.append(FORM_CONFIG.intent.name, BULK_ACTION_INTENTS[bulkAction])
    for (const record of confirmedRecords) formData.append('ids', record.id)
    void fetcher.submit(formData, { action, method: 'POST' })
  }

  return (
    <>
      <AdminSelectionBar
        className={clsx(styles.bar, className)}
        count={records.length}
        message={message}
        onClear={onClear}
      >
        {actions.map((bulkAction) => (
          <Button
            disabled={isSubmitting}
            key={bulkAction}
            onClick={() => setOpenAction(bulkAction)}
            size={'sm'}
            type={'button'}
            variant={'outline'}
          >
            {BULK_ACTION_LABELS[bulkAction]}
          </Button>
        ))}
      </AdminSelectionBar>

      {openAction !== null && (
        <BulkConfirmDialog
          action={openAction}
          isCreator={isCreator}
          notes={isPublishing ? publishExceptions : []}
          noun={noun}
          onClose={() => setOpenAction(null)}
          onConfirm={() => submit(openAction)}
          onlyDrafts={onlyDrafts}
          records={confirmedRecords}
          skipped={isPublishing ? null : heldSkipNote}
        />
      )}
    </>
  )
}
