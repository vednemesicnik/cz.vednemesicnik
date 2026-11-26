/** How the reader last acted on the page: a mouse, pen or touch, or a key. */
export type InputModality = 'pointer' | 'keyboard'

/**
 * Creates the store of the reader's last kind of input, which decides whether
 * a focus the app moves should show its ring (design 30i: the ring is for the
 * keyboard). Safari doesn't focus a clicked link, so a focus moved after a
 * click counts as `:focus-visible` there, and CSS can't tell it from a key.
 *
 * @returns `read` the last input, and `startTracking` it on the document,
 *   which returns the cleanup.
 */
export const createInputModalityStore = () => {
  let modality: InputModality | null = null

  const handlePointerDown = () => {
    modality = 'pointer'
  }

  const handleKeyDown = () => {
    modality = 'keyboard'
  }

  return {
    read: () => modality,
    startTracking: () => {
      // Capture, so a handler that stops the event still leaves its trace.
      document.addEventListener('pointerdown', handlePointerDown, true)
      document.addEventListener('keydown', handleKeyDown, true)

      return () => {
        document.removeEventListener('pointerdown', handlePointerDown, true)
        document.removeEventListener('keydown', handleKeyDown, true)
      }
    },
  }
}

/** The page's one input-modality store. */
export const inputModalityStore = createInputModalityStore()
