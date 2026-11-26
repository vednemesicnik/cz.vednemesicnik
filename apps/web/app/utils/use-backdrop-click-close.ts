import { type RefObject, useEffect } from 'react'

/**
 * Closes a modal `<dialog>` on a click outside it in browsers without
 * `closedby` (Safari); put `closedby="any"` on the dialog for the rest.
 * Without `closedby`, a click on the backdrop targets the dialog itself.
 *
 * @param ref - The dialog.
 */
export const useBackdropClickClose = (
  ref: RefObject<HTMLDialogElement | null>,
) => {
  useEffect(() => {
    const dialog = ref.current

    if (dialog === null || 'closedBy' in HTMLDialogElement.prototype) return

    const handleClick = (event: MouseEvent) => {
      if (event.target !== dialog) return

      const rectangle = dialog.getBoundingClientRect()
      const isInside =
        rectangle.top <= event.clientY &&
        event.clientY <= rectangle.bottom &&
        rectangle.left <= event.clientX &&
        event.clientX <= rectangle.right

      if (!isInside) dialog.close()
    }

    dialog.addEventListener('click', handleClick)

    return () => dialog.removeEventListener('click', handleClick)
  }, [ref])
}
