import { useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  onConfirm: () => void
  /** Closed any way but *Odebrat*. */
  onCancel: () => void
}

/**
 * Asks before a stored image goes (design 24b, 1pdzkd57): *Odebrat* deletes it
 * at once with its alt text and caption, and it cannot be undone. It names no
 * file; it opens from that tile's „⋯“ (8kfn4ou3).
 */
export const RemoveImageDialog = ({ onConfirm, onCancel }: Props) => {
  // The native close comes after the confirm, maybe after a re-render.
  const isConfirmedRef = useRef(false)
  const ref = useModalDialog(() => {
    if (!isConfirmedRef.current) onCancel()
  })

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>Odebrat obrázek?</AdminModalTitle>
        <AdminModalDescription>
          Obrázek se hned smaže i s alt textem a popiskem. Odebrání nelze
          vrátit.
        </AdminModalDescription>

        <AdminModalActions>
          <Button
            onClick={() => ref.current?.close()}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            Zrušit
          </Button>
          <Button
            onClick={() => {
              isConfirmedRef.current = true
              ref.current?.close()
              onConfirm()
            }}
            size={'sm'}
            type={'button'}
            variant={'danger'}
          >
            Odebrat
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
