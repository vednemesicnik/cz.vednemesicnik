import { type InputModality, inputModalityStore } from './input-modality-store'
import { supportsFocusVisibleOption } from './supports-focus-visible-option'

/**
 * Moves the focus the app hands back, a row after a return to its list or a
 * gallery tile after its viewer closes, with the ring only after the
 * keyboard (design 30i). After a mouse or touch the focus moves without it
 * where the browser takes `focusVisible`, and stays where it is elsewhere:
 * Safari doesn't focus a clicked control, so it draws the ring for any focus
 * the app moves after a click or a tap.
 *
 * @param element - What gets the focus.
 * @param modality - How the reader last acted; the tracked one by default,
 *   `null` when not known, which counts as the keyboard.
 */
export const focusAfterInput = (
  element: HTMLElement,
  modality: InputModality | null = inputModalityStore.read(),
) => {
  if (modality !== 'pointer') {
    element.focus({ preventScroll: true })
    return
  }

  if (supportsFocusVisibleOption()) {
    element.focus({ focusVisible: false, preventScroll: true })
  }
}
