import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { HistoryList } from '~/components/history-list'
import type { ContentHistory } from '~/utils/content-log/to-content-history'
import { useBackdropClickClose } from '~/utils/use-backdrop-click-close'
import { useModalDialog } from '~/utils/use-modal-dialog'

import styles from './_styles.module.css'

type Props = {
  podcastTitle: string
  history: ContentHistory
  onClose: () => void
}

/**
 * The podcast's Historie (design 27j, xzh3fzxo): the page has no right column,
 * so the whole list opens in a dialog, without the five-row cap. A long list
 * scrolls inside the body; *Zavřít*, Esc and a click outside close it. Copy
 * approved (pteapzaq).
 */
export const PodcastHistoryDialog = ({
  podcastTitle,
  history,
  onClose,
}: Props) => {
  const ref = useModalDialog(onClose)
  useBackdropClickClose(ref)

  return (
    <AdminDialog closedby={'any'} ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{`Historie podcastu ${podcastTitle}`}</AdminModalTitle>

        <div className={styles.body}>
          <HistoryList
            entries={history.entries}
            isIncomplete={history.isIncomplete}
          />
        </div>

        <AdminModalActions>
          <Button
            onClick={() => ref.current?.close()}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            Zavřít
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
