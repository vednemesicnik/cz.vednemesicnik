import type { ReactNode } from 'react'

import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { Button } from '~/components/button'
import { useContentChangedDialog } from '~/components/content-changed-dialog'

type Props = {
  children?: ReactNode
}

/**
 * The actions of a `ContentChangedDialog` (24i): what the editor offers to
 * rescue, then *Načíst aktuální verzi* or *Otevřít detail*.
 *
 * @param props.children - An action before the main one, such as *Zkopírovat
 *   celý text*.
 * @returns The actions row
 */
export const ContentChangedDialogActions = ({ children }: Props) => {
  const { canReload, leave } = useContentChangedDialog()

  return (
    <AdminModalActions>
      {children}
      <Button onClick={leave} size={'sm'} type={'button'}>
        {canReload ? 'Načíst aktuální verzi' : 'Otevřít detail'}
      </Button>
    </AdminModalActions>
  )
}
