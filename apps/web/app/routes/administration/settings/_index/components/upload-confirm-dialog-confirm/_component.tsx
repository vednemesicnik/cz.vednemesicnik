import type { ReactNode } from 'react'

import { Button } from '~/components/button'

import { useUploadConfirmDialog } from '../upload-confirm-dialog'

type Props = {
  isDanger: boolean
  children: ReactNode
}

/**
 * The last action of an `UploadConfirmDialog`: closes it and goes on.
 *
 * @param props.isDanger - While the photo still uploads the confirm cancels
 *   it: danger.
 * @param props.children - The label, e.g. „Zrušit nahrávání a zavřít“.
 * @returns The button
 */
export const UploadConfirmDialogConfirm = ({ isDanger, children }: Props) => {
  const { confirm } = useUploadConfirmDialog()

  return (
    <Button
      onClick={confirm}
      size={'sm'}
      type={'button'}
      variant={isDanger ? 'danger' : 'primary'}
    >
      {children}
    </Button>
  )
}
