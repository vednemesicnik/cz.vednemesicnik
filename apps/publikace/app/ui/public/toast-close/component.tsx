import type { Handle } from 'remix/component'
import { clientEntry, on } from 'remix/component'

import { previousTabbable } from './previous-tabbable.ts'

export type ToastCloseProps = {
  /** The button's accessible name; it shows only the ✕. */
  label: string
}

/** Set on the toast once it is closed; the toast's own style hides it. */
export const TOAST_CLOSED_ATTRIBUTE = 'data-closed'

/**
 * The close button at the end of a toast that stays until the next load (`11g`): the toast hides
 * at once, with no request, and keeps its room until the next load (`11f`).
 *
 * Focus on the button moves first to what Tab reached just before the toast, with no scroll, so
 * it never stays on something hidden. Focus that was elsewhere stays there: Safari does not focus
 * a button when it is clicked, and the page must not jump to a ring after a pointer close. In Chrome and
 * Firefox a focus moved after a click does not match `:focus-visible`, so it draws no ring either.
 *
 * The page draws the toast closed again on a reload of its own (`TOAST_CLOSED_COOKIE`), and a
 * toast of the next load comes without the attribute, so the reconcile takes it off.
 */
export const ToastClose = clientEntry(
  import.meta.url,
  function ToastClose(handle: Handle<ToastCloseProps>) {
    function close(button: HTMLButtonElement): void {
      let toast = button.closest('.vdm-toast')
      if (toast === null) return
      if (toast.contains(document.activeElement)) {
        previousTabbable(toast)?.focus({ focusVisible: false, preventScroll: true })
      }
      toast.setAttribute(TOAST_CLOSED_ATTRIBUTE, '')
    }

    return () => (
      <button
        aria-label={handle.props.label}
        class="vdm-toast__close"
        mix={on('click', (event) => close(event.currentTarget as HTMLButtonElement))}
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
