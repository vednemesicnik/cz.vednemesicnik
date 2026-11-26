import type { RefObject } from 'react'

export const closeDialog = (dialogRef: RefObject<HTMLDialogElement | null>) => {
  const dialog = dialogRef.current
  if (dialog === null) return

  const cancelEvent = new Event('cancel', {
    cancelable: true,
  })
  dialog.dispatchEvent(cancelEvent)
}
