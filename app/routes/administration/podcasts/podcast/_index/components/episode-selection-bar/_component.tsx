import { useState } from 'react'
import { useFetcher } from 'react-router'

import { AdminSelectionBar } from '~/components/admin/admin-selection-bar'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { BulkConfirmDialog } from '~/components/bulk-confirm-dialog'
import { Button } from '~/components/button'
import { BULK_ACTION_INTENTS } from '~/config/bulk-action-intents'
import { BULK_ACTION_LABELS } from '~/config/bulk-action-labels'
import { EPISODE_BULK_NOUN } from '~/config/bulk-noun-config'
import { FORM_CONFIG } from '~/config/form-config'
import type { BulkActionResult } from '~/utils/bulk-action/bulk-action-result'
import { formatHeldSkipNote } from '~/utils/bulk-action/format-held-skip-note'
import type { BulkAction } from '~/utils/bulk-action/get-bulk-actions'
import { getBulkPublishNotes } from '~/utils/bulk-action/get-bulk-publish-notes'
import { getSelectionBarContent } from '~/utils/bulk-action/get-selection-bar-content'

import { EpisodeBulkPublishDialog } from '../episode-bulk-publish-dialog'

import styles from './_styles.module.css'

/** A selected episode as the bar reads it; `title` is „#13 …“. */
type SelectedEpisode = {
  id: string
  title: string
  number: number | null
  state: string
  publishedAt: string | null
  bulkActions: BulkAction[]
  isHeldByOther: boolean
  isIncomplete: boolean
  isNotSubmitted: boolean
}

type Props = {
  action: string
  fetcherKey: string
  episodes: SelectedEpisode[]
  isPodcastPublished: boolean
  isCreator: boolean
  onClear: () => void
}

/**
 * The episode table's selection bar (design 27b): the 22c bar and its
 * dialogs, with *Publikovat…* in a dialog of its own that orders by number.
 * On an unpublished podcast nothing is published (27f), and when only that
 * stands in the way the bar says so. The page answers the result
 * (`useBulkActionResult`).
 *
 * @param props.episodes - The selected episodes, in the table's order.
 * @param props.isPodcastPublished - Whether the podcast is on the web.
 * @param props.isCreator - A Creator selects: retracting says who publishes
 *   again.
 * @param props.onClear - Clears the selection.
 */
export const EpisodeSelectionBar = ({
  action,
  fetcherKey,
  episodes,
  isPodcastPublished,
  isCreator,
  onClear,
}: Props) => {
  const fetcher = useFetcher<BulkActionResult>({ key: fetcherKey })
  const authenticityToken = useAuthenticityToken()
  const [openAction, setOpenAction] = useState<BulkAction | null>(null)

  const isSubmitting = fetcher.state !== 'idle'

  const { actions, message } = getSelectionBarContent(
    episodes,
    EPISODE_BULK_NOUN,
    { isParentUnpublished: !isPodcastPublished },
  )

  // An episode someone else edits is skipped and said apart (22f).
  const unheldEpisodes = episodes.filter((episode) => !episode.isHeldByOther)
  const heldSkipNote = formatHeldSkipNote(
    episodes.length - unheldEpisodes.length,
    EPISODE_BULK_NOUN,
  )
  const onlyDrafts = unheldEpisodes.every(
    (episode) => episode.state === 'draft',
  )

  // Publishing leaves out the incomplete ones too and says so (27h), and goes
  // by number: the highest first, one without a number last.
  const completeEpisodes = unheldEpisodes
    .filter((episode) => !episode.isIncomplete)
    .sort(
      (first, second) =>
        (second.number ?? Number.NEGATIVE_INFINITY) -
        (first.number ?? Number.NEGATIVE_INFINITY),
    )
  const publishNotes = getBulkPublishNotes({
    incompleteCount: unheldEpisodes.length - completeEpisodes.length,
    notSubmittedCount: completeEpisodes.filter(
      (episode) => episode.isNotSubmitted,
    ).length,
    noun: EPISODE_BULK_NOUN,
    pendingCount: completeEpisodes.filter(
      (episode) => episode.state === 'pending',
    ).length,
  })
  const publishSentence = [
    publishNotes.notes,
    publishNotes.skipped,
    heldSkipNote,
  ]
    .filter((sentence) => sentence !== null)
    .join(' ')

  const submit = (bulkAction: BulkAction, ids: string[]) => {
    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    formData.append(FORM_CONFIG.intent.name, BULK_ACTION_INTENTS[bulkAction])
    for (const id of ids) formData.append('ids', id)
    void fetcher.submit(formData, { action, method: 'POST' })
  }

  const close = () => setOpenAction(null)

  return (
    <>
      <AdminSelectionBar
        className={styles.bar}
        count={episodes.length}
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

      {openAction === 'publish' && (
        <EpisodeBulkPublishDialog
          action={action}
          fetcherKey={fetcherKey}
          keptEpisodes={completeEpisodes.flatMap((episode) =>
            episode.publishedAt === null
              ? []
              : [{ ...episode, publishedAt: episode.publishedAt }],
          )}
          notes={publishSentence === '' ? null : publishSentence}
          onClose={close}
          orderedEpisodes={completeEpisodes.filter(
            (episode) => episode.publishedAt === null,
          )}
        />
      )}
      {openAction !== null && openAction !== 'publish' && (
        <BulkConfirmDialog
          action={openAction}
          isCreator={isCreator}
          noun={EPISODE_BULK_NOUN}
          onClose={close}
          onConfirm={() =>
            submit(
              openAction,
              unheldEpisodes.map((episode) => episode.id),
            )
          }
          onlyDrafts={onlyDrafts}
          records={unheldEpisodes}
          skipped={heldSkipNote}
        />
      )}
    </>
  )
}
