import { type ReactNode, useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { DialogBody } from '~/components/dialog-body'
import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  title: string
  /** The body's paragraphs (`AdminModalDescription`). */
  children: ReactNode
  stayLabel: string
  confirmLabel: string
  /** While the photo still uploads the confirm cancels it: danger. */
  isDanger: boolean
  onConfirm: () => void
  /** Closed any way but the confirm button; Esc too. */
  onStay: () => void
}

/**
 * Asks over the profile before closing it, saving it or leaving Nastavení
 * cancels the photo's upload (design 29b, yyxgpzr2, o9j577ga; copy axz8tav5).
 * The caller recomputes its words when the upload ends; it never closes by
 * itself.
 */
export const UploadConfirmDialog = ({
  title,
  children,
  stayLabel,
  confirmLabel,
  isDanger,
  onConfirm,
  onStay,
}: Props) => {
  // The native close comes after the confirm, maybe after a re-render.
  const isConfirmingRef = useRef(false)
  const ref = useModalDialog(() => {
    if (!isConfirmingRef.current) onStay()
  })

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{title}</AdminModalTitle>
        <DialogBody>{children}</DialogBody>
        <AdminModalActions>
          <Button
            onClick={() => ref.current?.close()}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            {stayLabel}
          </Button>
          <Button
            onClick={() => {
              isConfirmingRef.current = true
              ref.current?.close()
              onConfirm()
            }}
            size={'sm'}
            type={'button'}
            variant={isDanger ? 'danger' : 'primary'}
          >
            {confirmLabel}
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
