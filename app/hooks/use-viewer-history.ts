import { type RefObject, useCallback, useEffect, useRef } from 'react'

import { popStateGuard } from '~/utils/history/popstate-guard'

// Marks the history entry the open viewer pushed.
const ENTRY_MARKER = 'imageViewer'

const readState = (state: unknown) =>
  typeof state === 'object' && state !== null
    ? (state as Record<string, unknown>)
    : {}

const isViewerEntry = (state: unknown) =>
  readState(state)[ENTRY_MARKER] === true

/**
 * Lets Back close a modal `<dialog>` that is an overlay, not a page (the image
 * viewer, design 12b, zn43av9y). Opening pushes one history entry with the
 * same URL, so one Back closes the dialog however far it was paged, and the
 * article stays where it was. Any other close (a button, Esc, `close()`)
 * steps back over that entry, so the next Back leaves the page as before.
 *
 * The entry carries React Router's own `history.state` (its index and key),
 * and `popStateGuard` stops the dialog's pops before the router's `popstate`
 * listener: the router never sees them, so it neither navigates nor reloads
 * the page's loaders. Native listeners, not React's `onClose`, which does not
 * fire reliably on `<dialog>`.
 *
 * @param ref - The dialog.
 * @returns `open`, which shows the dialog as a modal and pushes the entry.
 */
export const useViewerHistory = (ref: RefObject<HTMLDialogElement | null>) => {
  // Set while a pop that this hook started, or that closes the dialog, is due.
  const isOwnPopDueRef = useRef(false)
  const isClosingByBackRef = useRef(false)
  // The router's key of the page entry the viewer opened on; its own entry
  // carries the same key.
  const pageKeyRef = useRef<unknown>(undefined)

  useEffect(() => {
    const dialog = ref.current

    if (dialog === null) return

    const stepBack = () => {
      isOwnPopDueRef.current = true
      window.history.back()
    }

    const handlePopState = (event: PopStateEvent) => {
      if (isOwnPopDueRef.current) {
        isOwnPopDueRef.current = false
        return true
      }

      if (dialog.open) {
        isClosingByBackRef.current = true
        dialog.close()
        return true
      }

      // Forward onto the entry of a viewer closed earlier on this page: step
      // over it. Another page's entry is the router's to navigate to.
      if (
        isViewerEntry(event.state) &&
        pageKeyRef.current !== undefined &&
        readState(event.state).key === pageKeyRef.current
      ) {
        stepBack()
        return true
      }

      return false
    }

    const handleClose = () => {
      if (isClosingByBackRef.current) {
        isClosingByBackRef.current = false
        return
      }

      if (isViewerEntry(window.history.state)) stepBack()
    }

    const release = popStateGuard.intercept(handlePopState)
    dialog.addEventListener('close', handleClose)

    return () => {
      release()
      dialog.removeEventListener('close', handleClose)
    }
  }, [ref])

  return useCallback(() => {
    const dialog = ref.current

    if (dialog === null || dialog.open) return

    dialog.showModal()
    pageKeyRef.current = readState(window.history.state).key
    window.history.pushState(
      { ...window.history.state, [ENTRY_MARKER]: true },
      '',
    )
  }, [ref])
}
