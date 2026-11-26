import { useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { DialogBody } from '~/components/dialog-body'
import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  /** The main image: the article is left without one (copy hu5a658a). */
  isFeatured: boolean
  onConfirm: () => void
  /** Closed any way but *Odebrat*. */
  onCancel: () => void
}

/**
 * Asks before a stored image goes (design 24b, 1pdzkd57): *Odebrat* deletes it
 * at once with its alt text and caption, and it cannot be undone. It names no
 * file; it opens from that tile's „⋯“ (8kfn4ou3).
 */
export const RemoveImageDialog = ({
  isFeatured,
  onConfirm,
  onCancel,
}: Props) => {
  // The native close comes after the confirm, maybe after a re-render.
  const isConfirmedRef = useRef(false)
  const ref = useModalDialog(() => {
    if (!isConfirmedRef.current) onCancel()
  })

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>Odebrat obrázek?</AdminModalTitle>
        <DialogBody>
          <AdminModalDescription>
            Obrázek se hned smaže i s alt textem a popiskem. Odebrání nelze
            vrátit.
          </AdminModalDescription>
          {/* Its own paragraph, only for the main image (in5bl1cq). */}
          {isFeatured && (
            <AdminModalDescription>
              Článek zůstane bez hlavního obrázku.
            </AdminModalDescription>
          )}
        </DialogBody>

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
