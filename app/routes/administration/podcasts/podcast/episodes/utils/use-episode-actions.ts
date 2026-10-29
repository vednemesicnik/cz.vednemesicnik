import { useRef, useState } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { useAdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentActionResult } from '~/hooks/use-content-action-result'

import type { EpisodeStateDialogKind } from '../components/episode-state-dialog'
import { EPISODE_DIRECT_INTENTS, type EpisodeAction } from './episode-actions'

type Options = {
  episode: {
    id: string
    slug: string
  }
  podcast: {
    id: string
    slug: string
  }
  fetcherKey: string
}

/**
 * Runs an episode's actions from its row (design 27b, 27f, 27h, 07c): a state
 * change at once, Publikovat…, Stáhnout z publikace…, Archivovat…, Změnit
 * datum… and Smazat… through their dialogs; an incomplete episode says what
 * it lacks, and an action the edit hold refused says who edits it.
 *
 * @param options.episode - The episode's id and its address.
 * @param options.podcast - Its podcast's id and address.
 * @param options.fetcherKey - The fetcher the actions and the dialogs share.
 * @returns `runAction`, whether an action is running, and what
 *   `EpisodeActionDialogs` renders.
 */
export const useEpisodeActions = ({
  episode,
  podcast,
  fetcherKey,
}: Options) => {
  const detailHref = href(
    '/administration/podcasts/:podcastId/episodes/:episodeId',
    { episodeId: episode.id, podcastId: podcast.id },
  )
  const editHref = href(
    '/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode',
    { episodeId: episode.id, podcastId: podcast.id },
  )

  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== 'idle'
  const authenticityToken = useAuthenticityToken()
  const navigate = useNavigate()
  const { closeMissingList, missingList } = useContentActionResult(
    fetcher.data,
    { heldSubject: 'epizodu' },
  )

  const [stateDialog, setStateDialog] = useState<EpisodeStateDialogKind | null>(
    null,
  )
  const [publishDialog, setPublishDialog] = useState<{
    isApproval: boolean
  } | null>(null)
  const [isChangeDateOpen, setIsChangeDateOpen] = useState(false)

  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const { openDialog: openDeleteDialog } = useAdminDeleteConfirmationDialog(
    deleteDialogRef,
    { action: detailHref, key: fetcherKey },
  )

  const runAction = (action: EpisodeAction) => {
    const intent = EPISODE_DIRECT_INTENTS[action]

    if (intent !== undefined) {
      const formData = new FormData()
      formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
      formData.append(FORM_CONFIG.intent.name, intent)
      void fetcher.submit(formData, { action: detailHref, method: 'POST' })
      return
    }

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
        // Only a published address is unique: the id says which draft to
        // show (log 0039).
        return window.open(
          `${href('/podcasts/:podcastSlug/:episodeSlug', {
            episodeSlug: episode.slug,
            podcastSlug: podcast.slug,
          })}?id=${episode.id}`,
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
