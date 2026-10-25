import { useFetcher } from 'react-router'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { DialogBody } from '~/components/dialog-body'
import { FORM_CONFIG } from '~/config/form-config'
import { useModalDialog } from '~/utils/use-modal-dialog'

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
  const fetcher = useFetcher({ key: fetcherKey })
  const ref = useModalDialog(onClose)

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>Archivovat podcast?</AdminModalTitle>
        <DialogBody>
          <AdminModalDescription>
            {publishedEpisodeCount === 0
              ? `Podcast ${podcastTitle} zmizí z webu. Znovu se zobrazí po obnovení jako konceptu a publikaci.`
              : `Podcast ${podcastTitle} i jeho ${formatPublishedEpisodeCount(publishedEpisodeCount)} zmizí z webu. Stav epizod se nezmění. Znovu se zobrazí po obnovení podcastu jako konceptu a jeho publikaci.`}
          </AdminModalDescription>
        </DialogBody>

        <fetcher.Form
          action={action}
          method={'post'}
          onSubmit={() => ref.current?.close()}
        >
          <AuthenticityTokenInput />
          <input
            name={FORM_CONFIG.intent.name}
            type={'hidden'}
            value={FORM_CONFIG.intent.value.archive}
          />

          <AdminModalActions>
            <Button
              onClick={() => ref.current?.close()}
              size={'sm'}
              type={'button'}
              variant={'ghost'}
            >
              Zrušit
            </Button>
            <Button size={'sm'} type={'submit'}>
              Archivovat podcast
            </Button>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
