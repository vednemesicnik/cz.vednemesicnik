import type { ContentState } from '@generated/prisma/enums'

import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'

import { ArticleChangeDateDialog } from '../../../../../articles/components/article-change-date-dialog'
import {
  EPISODE_CHANGE_DATE_DESCRIPTION,
  EPISODE_HEADER_SENTENCES,
} from '../../utils/episode-actions'
import type { useEpisodeActions } from '../../utils/use-episode-actions'
import { EpisodeMissingDialog } from '../episode-missing-dialog'
import { EpisodePublishDialog } from '../episode-publish-dialog'
import { EpisodeStateDialog } from '../episode-state-dialog'

type Props = {
  actions: ReturnType<typeof useEpisodeActions>
  episode: {
    title: string
    state: ContentState
    authorName: string
    publishedAt: string | null
    isNotSubmitted: boolean
  }
  canDelete: boolean
  isApprover: boolean
}

/**
 * The dialogs of an episode's row actions (design 27b, 27f, 27h): Smazat…,
 * Stáhnout z publikace… or Archivovat…, Publikovat…, Změnit datum… and what
 * an incomplete episode lacks.
 *
 * @param props.actions - The episode's `useEpisodeActions`.
 * @param props.episode - What the dialogs say about it, its title as the row
 *   shows it.
 * @param props.canDelete - Whether Smazat… is offered, so its dialog exists.
 * @param props.isApprover - Whether the signed-in author is the Coordinator.
 */
export const EpisodeActionDialogs = ({
  actions,
  episode,
  canDelete,
  isApprover,
}: Props) => (
  <>
    {canDelete && (
      <AdminDeleteConfirmationDialog
        description={'Smazání je nevratné.'}
        ref={actions.deleteDialogRef}
        subject={episode.title}
        title={
          episode.state === 'archived'
            ? 'Smazat archivovanou epizodu?'
            : 'Smazat koncept?'
        }
      />
    )}
    {actions.stateDialog !== null && (
      <EpisodeStateDialog
        action={actions.detailHref}
        episodeTitle={episode.title}
        fetcherKey={actions.fetcherKey}
        isApprover={isApprover}
        kind={actions.stateDialog}
        onClose={actions.closeStateDialog}
      />
    )}
    {actions.missingList !== null && (
      <EpisodeMissingDialog
        editHref={actions.editHref}
        missingList={actions.missingList}
        onClose={actions.closeMissingList}
      />
    )}
    {actions.publishDialog !== null && (
      <EpisodePublishDialog
        action={actions.detailHref}
        authorName={episode.authorName}
        episodeTitle={episode.title}
        fetcherKey={actions.fetcherKey}
        isApproval={actions.publishDialog.isApproval}
        note={
          episode.isNotSubmitted
            ? EPISODE_HEADER_SENTENCES['not-submitted']
            : null
        }
        onClose={actions.closePublishDialog}
        originalPublishedAt={episode.publishedAt}
      />
    )}
    {actions.isChangeDateOpen && (
      <ArticleChangeDateDialog
        action={actions.detailHref}
        description={EPISODE_CHANGE_DATE_DESCRIPTION}
        fetcherKey={actions.fetcherKey}
        onClose={actions.closeChangeDate}
        publishedAt={episode.publishedAt}
        title={episode.title}
      />
    )}
  </>
)
