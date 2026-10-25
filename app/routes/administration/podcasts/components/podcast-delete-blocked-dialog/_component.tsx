import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { DialogBody } from '~/components/dialog-body'
import { Link } from '~/components/link'
import type { CountForms } from '~/config/list-noun-config'
import { formatListCount } from '~/utils/format-list-count'
import { useModalDialog } from '~/utils/use-modal-dialog'

// What the podcast has, in the accusative: má 1 epizodu, 2 epizody, 13 epizod.
const EPISODE_ACCUSATIVE_FORMS: CountForms = {
  few: 'epizody',
  many: 'epizody',
  one: 'epizodu',
  other: 'epizod',
  two: 'epizod',
  zero: 'epizod',
}

type Props = {
  podcastTitle: string
  episodeCount: number
  /** The podcast's page, from a list; on the page itself the episodes are there. */
  episodesHref?: string
  onClose: () => void
}

/**
 * Why a podcast with episodes cannot be deleted, in place of the
 * confirmation (design 27f, tly4a163): its episodes hold it, every state
 * counted. The count leads to the episode table. Opens as it mounts.
 */
export const PodcastDeleteBlockedDialog = ({
  podcastTitle,
  episodeCount,
  episodesHref,
  onClose,
}: Props) => {
  const ref = useModalDialog(onClose)
  const count = formatListCount(episodeCount, EPISODE_ACCUSATIVE_FORMS)

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{`Podcast ${podcastTitle} nejde smazat`}</AdminModalTitle>
        <DialogBody>
          <AdminModalDescription>
            Podcast má{' '}
            {episodesHref === undefined ? (
              count
            ) : (
              <Link to={episodesHref}>{count}</Link>
            )}
            . Smazat ho lze až po smazání všech jeho epizod.
          </AdminModalDescription>
        </DialogBody>
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
