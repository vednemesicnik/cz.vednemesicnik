import type { RefObject } from "react"

import { AdminButton } from "~/components/admin-button"
import { AdminDialog } from "~/components/admin-modal"
import { AdminModalActions } from "~/components/admin-modal-actions"
import { AdminModalContent } from "~/components/admin-modal-content"
import { AdminModalDescription } from "~/components/admin-modal-description"
import { AdminModalTitle } from "~/components/admin-modal-title"
import { DeleteIcon } from "~/components/icons/delete-icon"
import { DIALOG_RETURN_VALUE } from "~/config/dialog-config"

type Props = {
  ref: RefObject<HTMLDialogElement | null>
}

export const AdminDeleteConfirmationDialog = ({ ref }: Props) => {
  const dialog = ref.current

  const handleDecline = () => dialog?.close(DIALOG_RETURN_VALUE.decline)
  const handleAccept = () => dialog?.close(DIALOG_RETURN_VALUE.accept)

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>Opravdu chcete tuto akci provést?</AdminModalTitle>
        <AdminModalDescription>Tato akce je nevratná.</AdminModalDescription>
        <AdminModalActions>
          <AdminButton
            type={"button"}
            variant={"secondary"}
            onClick={handleDecline}
          >
            Zrušit
          </AdminButton>
          <AdminButton
            type={"button"}
            variant={"danger"}
            onClick={handleAccept}
          >
            <DeleteIcon />
            Smazat
          </AdminButton>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
