import type { RefObject } from 'react'

import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminDeleteConfirmationDialogActions } from '~/components/admin/admin-delete-confirmation-dialog-actions'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'

type Props = {
  ref: RefObject<HTMLDialogElement | null>
  /** The account's name, in the 1st case (`user.author.name`). */
  name: string
}

/**
 * Confirms deleting an account (design 28g, jh9c3a7n; copy 9w0473vu,
 * 0t7rbimg): the author stays, which „smazat Terezu“ would not say on its own.
 * The name follows a colon: in the 1st case, „účet Jana“ reads as Jan's.
 */
export const UserDeleteConfirmationDialog = ({ ref, name }: Props) => (
  <AdminDeleteConfirmationDialog ref={ref}>
    <AdminModalTitle>{`Smazat účet: ${name}?`}</AdminModalTitle>
    <AdminModalDescription>
      Tímto účtem se už nepůjde přihlásit. Autor i jméno u obsahu zůstanou
      zachovány. Vrátit to nejde.
    </AdminModalDescription>
    <AdminDeleteConfirmationDialogActions>
      Smazat účet
    </AdminDeleteConfirmationDialogActions>
  </AdminDeleteConfirmationDialog>
)
