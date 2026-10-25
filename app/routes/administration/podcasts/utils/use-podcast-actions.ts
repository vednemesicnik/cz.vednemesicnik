import type { ContentState } from '@generated/prisma/enums'
import { useRef, useState } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { useAdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentActionResult } from '~/hooks/use-content-action-result'

import { TAXONOMY_DIRECT_INTENTS } from '../../articles/utils/taxonomy-actions'
import { PODCAST_TOASTS, type PodcastAction } from './podcast-actions'

type Options = {
  podcast: {
    id: string
    title: string
    slug: string
    state: ContentState
    episodeCount: number
    publishedEpisodeCount: number
  }
  fetcherKey: string
  deleteRedirects: boolean
}

/**
 * Runs a podcast's actions from its list row or its page (design 27a, 27b,
 * 27f): state changes at once with their toast, Archivovat… through its
 * confirmation, Smazat… through the delete dialog, or with episodes, why it
 * cannot be deleted.
 *
 * @param options.fetcherKey - The fetcher the actions and the dialogs share.
 * @param options.deleteRedirects - Whether a delete leaves for the list, as
 *   from the podcast's page.
 * @returns `runAction`, whether an action is running, and what
 *   `PodcastActionDialogs` renders.
 */
export const usePodcastActions = ({
  podcast,
  fetcherKey,
  deleteRedirects,
}: Options) => {
  const podcastHref = href('/administration/podcasts/:podcastId', {
    podcastId: podcast.id,
  })
  const fetcher = useFetcher({ key: fetcherKey })
  const isSubmitting = fetcher.state !== 'idle'
  const authenticityToken = useAuthenticityToken()
  const navigate = useNavigate()

  useContentActionResult(fetcher.data, { toasts: PODCAST_TOASTS })

  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const { openDialog: openDeleteDialog } = useAdminDeleteConfirmationDialog(
    deleteDialogRef,
    { action: podcastHref, key: fetcherKey, withRedirect: deleteRedirects },
  )
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [isDeleteBlockedOpen, setIsDeleteBlockedOpen] = useState(false)

  const runAction = (action: PodcastAction) => {
    switch (action) {
      case 'archive':
        return setIsArchiveOpen(true)
      // Its episodes hold it: why, in place of the confirmation (27f).
      case 'delete':
        return podcast.episodeCount > 0
          ? setIsDeleteBlockedOpen(true)
          : openDeleteDialog()
      case 'edit':
        return navigate(
          href('/administration/podcasts/:podcastId/edit-podcast', {
            podcastId: podcast.id,
          }),
        )
      case 'view-on-web':
        return window.open(
          href('/podcasts/:podcastSlug', { podcastSlug: podcast.slug }),
          '_blank',
          'noopener',
        )
    }

    const intent = TAXONOMY_DIRECT_INTENTS[action]

    if (intent === undefined) return

    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    formData.append(FORM_CONFIG.intent.name, intent)
    void fetcher.submit(formData, { action: podcastHref, method: 'POST' })
  }

  return {
    closeArchive: () => setIsArchiveOpen(false),
    closeDeleteBlocked: () => setIsDeleteBlockedOpen(false),
    deleteDialogRef,
    fetcherKey,
    isArchiveOpen,
    isDeleteBlockedOpen,
    isSubmitting,
    podcast,
    podcastHref,
    runAction,
  }
}
