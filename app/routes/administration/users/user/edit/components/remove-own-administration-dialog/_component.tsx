import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { useModalDialog } from '~/utils/use-modal-dialog'
import { USER_RECORD_COPY } from '../../../../user-record-copy'

type Props = {
  onConfirm: () => void
  onClose: () => void
}

const { confirm, description, title } = USER_RECORD_COPY.removeOwnAdministration

/**
 * Confirms removing one's own administration before Upravit uživatele saves
 * it (design 28g): nobody can undo it alone. Mounted to open; Zrušit saves
 * nothing.
 *
 * @param props.onConfirm - Odebrat správu: save the form.
 * @param props.onClose - The dialog has closed, either way.
 */
export const RemoveOwnAdministrationDialog = ({
  onConfirm,
  onClose,
}: Props) => {
  const ref = useModalDialog(onClose)

  const handleCancel = () => ref.current?.close()
  const handleConfirm = () => {
    ref.current?.close()
    onConfirm()
  }

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{title}</AdminModalTitle>
        <AdminModalDescription>{description}</AdminModalDescription>
        <AdminModalActions>
          <Button
            onClick={handleCancel}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            Zrušit
          </Button>
          {/* Primary, not danger: it takes nothing away from anyone else (28g). */}
          <Button
            onClick={handleConfirm}
            size={'sm'}
            type={'button'}
            variant={'primary'}
          >
            {confirm}
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
