import { useEffect, useRef } from 'react'

/**
 * Opens a `<dialog>` as a modal as soon as it mounts and reports when it
 * closes, however it closes (a button, Esc, `close()`). The settings page
 * mounts a dialog to open it and unmounts it on close, so every opening starts
 * from a clean state. Native listeners, not React's `onClose`, which does not
 * fire reliably on `<dialog>`.
 *
 * @param onClose - Called once the dialog has closed.
 * @returns The ref to put on the dialog.
 */
export const useModalDialog = (onClose: () => void) => {
  const ref = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const dialog = ref.current

    if (dialog === null) return

    if (!dialog.open) {
      dialog.showModal()
    }

    const handleClose = () => onCloseRef.current()
    dialog.addEventListener('close', handleClose)

    return () => dialog.removeEventListener('close', handleClose)
  }, [])

  return ref
}
