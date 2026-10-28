import { type RefObject, useEffect, useRef } from 'react'

/**
 * Keeps the focus with a file while it uploads (design 26c, as the profile
 * photo in 29b; the podcast and episode covers, 27e, 27d): on the pick it goes to the row's *Zrušit*, and once the
 * upload ended, to the file's first control (*Nahradit*, the field, or
 * *Zkusit znovu*), unless it moved somewhere else meanwhile. The control that
 * had it is gone either way.
 *
 * @param isUploading - Whether the file uploads now.
 * @param containerRef - The file's column, holding the row and its controls.
 */
export const useUploadFocus = (
  isUploading: boolean,
  containerRef: RefObject<HTMLElement | null>,
) => {
  const wasUploadingRef = useRef(false)

  useEffect(() => {
    const wasUploading = wasUploadingRef.current
    wasUploadingRef.current = isUploading
    if (isUploading === wasUploading) return

    const container = containerRef.current
    if (container === null) return

    if (isUploading) {
      container.querySelector<HTMLButtonElement>('button')?.focus()
      return
    }

    const focused = document.activeElement
    if (
      focused === null ||
      focused === document.body ||
      container.contains(focused)
    ) {
      container
        .querySelector<HTMLElement>('button, input[type="file"]:not([hidden])')
        ?.focus()
    }
  }, [isUploading, containerRef])
}
