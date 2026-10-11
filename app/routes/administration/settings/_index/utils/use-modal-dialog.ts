import { useEffect, useRef } from 'react'

type Options = {
  // While it returns `true`, a close (e.g. Esc pressed twice, which the
  // browser no longer lets the page cancel) reopens the dialog instead.
  shouldStayOpen?: () => boolean
}

/**
 * Opens a `<dialog>` as a modal as soon as it mounts and reports when it
 * closes, however it closes (a button, Esc, `close()`). The settings page
 * mounts a dialog to open it and unmounts it on close, so every opening starts
 * from a clean state. Native listeners, not React's `onClose`, which does not
 * fire reliably on `<dialog>`.
 *
 * @param onClose - Called once the dialog has closed.
 * @param options - `shouldStayOpen` keeps the dialog open while it holds.
 * @returns The ref to put on the dialog.
 */
export const useModalDialog = (onClose: () => void, options: Options = {}) => {
  const ref = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  const shouldStayOpenRef = useRef(options.shouldStayOpen)
  onCloseRef.current = onClose
  shouldStayOpenRef.current = options.shouldStayOpen

  useEffect(() => {
    const dialog = ref.current

    if (dialog === null) return

    if (!dialog.open) {
      dialog.showModal()
    }

    const handleCancel = (event: Event) => {
      if (shouldStayOpenRef.current?.()) {
        event.preventDefault()
      }
    }

    const handleClose = () => {
      if (shouldStayOpenRef.current?.()) {
        dialog.showModal()
        return
      }

      onCloseRef.current()
    }

    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('close', handleClose)

    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('close', handleClose)
    }
  }, [])

  return ref
}
