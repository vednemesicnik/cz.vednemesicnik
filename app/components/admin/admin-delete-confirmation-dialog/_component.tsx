import type { RefObject } from 'react'

import { AdminButton } from '~/components/admin/admin-button'
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { DIALOG_RETURN_VALUE } from '~/config/dialog-config'

type Props = {
  ref: RefObject<HTMLDialogElement | null>
}

export const AdminDeleteConfirmationDialog = ({ ref }: Props) => {
  // Read ref.current inside the handlers, not during render: the <dialog> is
  // attached in the commit phase, so at render time ref.current is still null
  // and a captured value would never close the dialog.
  const handleDecline = () => ref.current?.close(DIALOG_RETURN_VALUE.decline)
  const handleAccept = () => ref.current?.close(DIALOG_RETURN_VALUE.accept)

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>Opravdu chcete tuto akci provést?</AdminModalTitle>
        <AdminModalDescription>Tato akce je nevratná.</AdminModalDescription>
        <AdminModalActions>
          <AdminButton
            onClick={handleDecline}
            type={'button'}
            variant={'secondary'}
          >
            Zrušit
          </AdminButton>
          <AdminButton
            onClick={handleAccept}
            type={'button'}
            variant={'danger'}
          >
            <DeleteIcon />
            Smazat
          </AdminButton>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
