import type { ReactNode } from 'react'

import { useAdminDeleteConfirmationDialogClose } from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { Button } from '~/components/button'

type Props = {
  children: ReactNode
}

/**
 * The actions of an `AdminDeleteConfirmationDialog`: Zrušit, then the red
 * delete, which closes the dialog as accepted.
 *
 * @param props.children - The delete's label: „Smazat“, or what goes, e.g.
 *   „Smazat účet“; a bulk delete repeats the title's count (26f, 25g).
 * @returns The actions row
 */
export const AdminDeleteConfirmationDialogActions = ({ children }: Props) => {
  const { accept, decline } = useAdminDeleteConfirmationDialogClose()

  return (
    <AdminModalActions>
      <Button onClick={decline} size={'sm'} type={'button'} variant={'ghost'}>
        Zrušit
      </Button>
      <Button onClick={accept} size={'sm'} type={'button'} variant={'danger'}>
        {children}
      </Button>
    </AdminModalActions>
  )
}
