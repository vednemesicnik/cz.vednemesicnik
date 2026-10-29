import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { DialogBody } from '~/components/dialog-body'
import { StateChangeDialog } from '~/components/state-change-dialog'
import { FORM_CONFIG } from '~/config/form-config'

import { formatPublishedEpisodeCount } from '../../utils/format-published-episode-count'

type Props = {
  action: string
  fetcherKey: string
  podcastTitle: string
  publishedEpisodeCount: number
  onClose: () => void
}

/**
 * Confirms *Archivovat…* of one podcast (design 27a, 27b; copy fzqkfmeg,
 * djni9qbc). The episodes keep their state, but the web shows only a
 * published podcast's episodes, so the published ones leave with it; the
 * sentence counts them, and has no count when there are none. Opens as it
 * mounts.
 */
export const PodcastArchiveDialog = ({
  action,
  fetcherKey,
  podcastTitle,
  publishedEpisodeCount,
  onClose,
}: Props) => {
  return (
    <StateChangeDialog
      action={action}
      confirmLabel={'Archivovat podcast'}
      fetcherKey={fetcherKey}
      intent={FORM_CONFIG.intent.value.archive}
      onClose={onClose}
    >
      <AdminModalTitle>Archivovat podcast?</AdminModalTitle>
      <DialogBody>
        <AdminModalDescription>
          {publishedEpisodeCount === 0
            ? `Podcast ${podcastTitle} zmizí z webu. Znovu se zobrazí po obnovení jako konceptu a publikaci.`
            : `Podcast ${podcastTitle} i jeho ${formatPublishedEpisodeCount(publishedEpisodeCount)} zmizí z webu. Stav epizod se nezmění. Znovu se zobrazí po obnovení podcastu jako konceptu a jeho publikaci.`}
        </AdminModalDescription>
      </DialogBody>
    </StateChangeDialog>
  )
}
