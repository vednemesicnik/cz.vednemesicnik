import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'

import type { usePodcastActions } from '../../utils/use-podcast-actions'
import { PodcastArchiveDialog } from '../podcast-archive-dialog'
import { PodcastDeleteBlockedDialog } from '../podcast-delete-blocked-dialog'

type Props = {
  actions: ReturnType<typeof usePodcastActions>
  canDelete: boolean
  /** From a list, the count in the 27f sentence leads to the podcast's page. */
  linksEpisodes: boolean
}

/**
 * The dialogs of a podcast's actions (design 27a, 27f): Archivovat…, Smazat…,
 * and why a podcast with episodes cannot be deleted.
 *
 * @param props.actions - The podcast's `usePodcastActions`.
 * @param props.canDelete - Whether Smazat… is offered, so its dialog exists.
 */
export const PodcastActionDialogs = ({
  actions,
  canDelete,
  linksEpisodes,
}: Props) => {
  const { podcast } = actions

  return (
    <>
      {canDelete && (
        <AdminDeleteConfirmationDialog
          description={'Smazání je nevratné.'}
          ref={actions.deleteDialogRef}
          subject={podcast.title}
          title={
            podcast.state === 'archived'
              ? 'Smazat archivovaný podcast?'
              : 'Smazat koncept?'
          }
        />
      )}
      {actions.isArchiveOpen && (
        <PodcastArchiveDialog
          action={actions.podcastHref}
          fetcherKey={actions.fetcherKey}
          onClose={actions.closeArchive}
          podcastTitle={podcast.title}
          publishedEpisodeCount={podcast.publishedEpisodeCount}
        />
      )}
      {actions.isDeleteBlockedOpen && (
        <PodcastDeleteBlockedDialog
          episodeCount={podcast.episodeCount}
          episodesHref={linksEpisodes ? actions.podcastHref : undefined}
          onClose={actions.closeDeleteBlocked}
          podcastTitle={podcast.title}
        />
      )}
    </>
  )
}
