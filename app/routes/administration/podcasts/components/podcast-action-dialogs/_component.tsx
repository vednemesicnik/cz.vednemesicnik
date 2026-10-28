import { href } from 'react-router'

import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'

import type { usePodcastActions } from '../../utils/use-podcast-actions'
import { PodcastArchiveDialog } from '../podcast-archive-dialog'
import { PodcastDeleteBlockedDialog } from '../podcast-delete-blocked-dialog'
import { PodcastMissingDialog } from '../podcast-missing-dialog'

type Props = {
  actions: ReturnType<typeof usePodcastActions>
  canDelete: boolean
  linksEpisodes: boolean
  isApprover: boolean
}

/**
 * The dialogs of a podcast's actions (design 27a, 27f, 27i): Archivovat…,
 * Smazat…, what blocks a submission or a publish, and why a podcast with
 * episodes cannot be deleted.
 *
 * @param props.actions - The podcast's `usePodcastActions`.
 * @param props.canDelete - Whether Smazat… is offered, so its dialog exists.
 * @param props.linksEpisodes - From a list, the count in the 27f sentence
 *   leads to the podcast's page.
 * @param props.isApprover - Whether the person is the Coordinator, who
 *   deletes every episode.
 */
export const PodcastActionDialogs = ({
  actions,
  canDelete,
  linksEpisodes,
  isApprover,
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
      {actions.missingList !== null && (
        <PodcastMissingDialog
          editHref={href('/administration/podcasts/:podcastId/edit-podcast', {
            podcastId: podcast.id,
          })}
          missingList={actions.missingList}
          onClose={actions.closeMissingList}
        />
      )}
      {actions.isDeleteBlockedOpen && (
        <PodcastDeleteBlockedDialog
          episodeCount={podcast.episodeCount}
          episodesHref={linksEpisodes ? actions.podcastHref : undefined}
          isApprover={isApprover}
          onClose={actions.closeDeleteBlocked}
          podcastTitle={podcast.title}
        />
      )}
    </>
  )
}
