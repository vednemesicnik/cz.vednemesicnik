import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'

import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  // Starts the passkey registration ceremony.
  onAdd: () => void
  onClose: () => void
}

/**
 * The step after an identity check for adding a passkey (design 29d): the
 * browser creates a passkey only after a new click, so the dialog continues
 * with a button. The result shows in the Passkey row.
 */
export const AddPasskeyDialog = ({ onAdd, onClose }: Props) => {
  const ref = useModalDialog(onClose)

  const handleCancel = () => ref.current?.close()
  const handleAdd = () => {
    onAdd()
    ref.current?.close()
  }

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>Přidat passkey</AdminModalTitle>
        <AdminModalDescription>
          Ověření proběhlo. Klikněte na Přidat passkey a pokračujte v okně
          prohlížeče.
        </AdminModalDescription>
        <AdminModalActions>
          <Button
            onClick={handleCancel}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            Zrušit
          </Button>
          <Button onClick={handleAdd} size={'sm'} type={'button'}>
            Přidat passkey
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
