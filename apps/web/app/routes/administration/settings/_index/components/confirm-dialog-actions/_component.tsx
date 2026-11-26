import type { ReactNode } from 'react'

import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { Button } from '~/components/button'

import { useConfirmDialog } from '../confirm-dialog'

type Props = {
  children: ReactNode
}

/**
 * The actions of a `ConfirmDialog`: Zrušit, then the red confirmation (29d).
 *
 * @param props.children - The confirmation's label, e.g. „Odebrat“.
 * @returns The actions row
 */
export const ConfirmDialogActions = ({ children }: Props) => {
  const { cancel, confirm } = useConfirmDialog()

  return (
    <AdminModalActions>
      <Button onClick={cancel} size={'sm'} type={'button'} variant={'ghost'}>
        Zrušit
      </Button>
      <Button onClick={confirm} size={'sm'} type={'button'} variant={'danger'}>
        {children}
      </Button>
    </AdminModalActions>
  )
}
