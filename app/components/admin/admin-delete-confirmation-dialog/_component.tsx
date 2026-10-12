import type { ReactNode, RefObject } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { DIALOG_RETURN_VALUE } from '~/config/dialog-config'

type Props = {
  ref: RefObject<HTMLDialogElement | null>
  title?: ReactNode
  description?: ReactNode
}

/**
 * Confirms a delete; closes with the accept or decline return value.
 *
 * @param props.title - The question, generic by default.
 * @param props.description - The sentence under it, generic by default.
 */
export const AdminDeleteConfirmationDialog = ({
  ref,
  title = 'Opravdu chcete tuto akci provést?',
  description = 'Tato akce je nevratná.',
}: Props) => {
  // Read ref.current inside the handlers, not during render: the <dialog> is
  // attached in the commit phase, so at render time ref.current is still null
  // and a captured value would never close the dialog.
  const handleDecline = () => ref.current?.close(DIALOG_RETURN_VALUE.decline)
  const handleAccept = () => ref.current?.close(DIALOG_RETURN_VALUE.accept)

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{title}</AdminModalTitle>
        <AdminModalDescription>{description}</AdminModalDescription>
        <AdminModalActions>
          <Button
            onClick={handleDecline}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            Zrušit
          </Button>
          <Button
            onClick={handleAccept}
            size={'sm'}
            type={'button'}
            variant={'danger'}
          >
            Smazat
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
