import type { Handle } from 'remix/component'
import { clientEntry, on } from 'remix/component'

import { TOAST_CLOSED_ATTRIBUTE } from '../toast-closed.ts'
import { previousTabbable } from './previous-tabbable.ts'

export type ToastCloseProps = {
  /** The button's accessible name; it shows only the ✕. */
  label: string
}

/**
 * The close button at the end of a toast that stays until the next load (`11g`): the toast hides
 * at once, with no request, and keeps its room until the next load (`11f`).
 *
 * Focus on the button moves first to what Tab reached just before the toast, with no scroll, so
 * it never stays on something hidden. It keeps its ring after Enter or Space, a `click` with no
 * pointer behind it (`detail` 0), and draws none after a mouse or a finger. Focus that was
 * elsewhere stays there: Safari does not focus a button when it is clicked.
 *
 * The page draws the toast closed again on a reload of its own (`TOAST_CLOSED_COOKIE`), and a
 * toast of the next load comes without the attribute, so the reconcile takes it off.
 */
export const ToastClose = clientEntry(
  import.meta.url,
  function ToastClose(handle: Handle<ToastCloseProps>) {
    function close(button: HTMLButtonElement, isKeyboard: boolean): void {
      let toast = button.closest('.vdm-toast')
      if (toast === null) return
      if (toast.contains(document.activeElement)) {
        previousTabbable(toast)?.focus({ focusVisible: isKeyboard, preventScroll: true })
      }
      toast.setAttribute(TOAST_CLOSED_ATTRIBUTE, '')
    }

    return () => (
      <button
        aria-label={handle.props.label}
        class="vdm-toast__close"
        mix={on('click', (event) =>
          close(event.currentTarget as HTMLButtonElement, event.detail === 0),
        )}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          focusable="false"
          height="16"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="16"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    )
  },
)
