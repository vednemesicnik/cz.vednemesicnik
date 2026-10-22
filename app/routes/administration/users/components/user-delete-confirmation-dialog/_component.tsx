import type { RefObject } from 'react'

import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'

type Props = {
  ref: RefObject<HTMLDialogElement | null>
  /** The account's name, in the 1st case (`user.author.name`). */
  name: string
}

/**
 * Confirms deleting an account (design 28g, copy 9w0473vu): the author stays,
 * which „smazat Terezu“ would not say on its own.
 */
export const UserDeleteConfirmationDialog = ({ ref, name }: Props) => (
  <AdminDeleteConfirmationDialog
    confirmLabel={'Smazat účet'}
    description={
      'Tímto účtem se už nepůjde přihlásit. Autor i jméno u obsahu zůstanou zachovány. Vrátit to nejde.'
    }
    ref={ref}
    title={`Smazat účet ${name}?`}
  />
)
