import type { ReactNode } from 'react'

import { Button } from '~/components/button'

import { useUploadConfirmDialog } from '../upload-confirm-dialog'

type Props = {
  children: ReactNode
}

/**
 * The first action of an `UploadConfirmDialog`: closes it, nothing changes.
 *
 * @param props.children - The label, e.g. „Zůstat“.
 * @returns The ghost button
 */
export const UploadConfirmDialogStay = ({ children }: Props) => {
  const { stay } = useUploadConfirmDialog()

  return (
    <Button onClick={stay} size={'sm'} type={'button'} variant={'ghost'}>
      {children}
    </Button>
  )
}
