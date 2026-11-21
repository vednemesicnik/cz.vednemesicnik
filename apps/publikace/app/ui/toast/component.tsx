import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import { CsrfField } from '../csrf-field/component.tsx'

export type ToastTone = 'error' | 'neutral'

/**
 * An action the toast offers, such as _Vrátit_ after _Je to souhlas_ (`13b`): a form posting to
 * `action`, so it works with no script, as the same button on the card does.
 */
export type ToastAction = { action: string; label: string }

/**
 * `detail` is the line under the message when somebody else got there first: who and when, in the
 * shape of a tag's line (`12l`, _21. 11. v 9:40 · Jana Veselá_).
 */
export type ToastMessage = {
  action?: ToastAction
  detail?: string
  message: string
  tone: ToastTone
}

export type ToastsProps = {
  messages: readonly ToastMessage[]
}

/*
 * Bottom left, over the page and clear of the panel's foot.
 *
 * The browser runtime draws the next page into the same document, so these regions stay and a
 * message put into them is announced: a confirmation politely, from `status`, an error at once,
 * from `alert`. Two sibling regions rather than one inside the other, which a screen reader may
 * read twice. A confirmation leaves by itself after five seconds, in CSS; an error stays, because
 * it asks for a step and could otherwise leave before it is read.
 */
const stackStyle = css({
  bottom: '18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  left: '242px',
  maxWidth: 'calc(100vw - 260px)',
  pointerEvents: 'none',
  position: 'fixed',
  zIndex: 'var(--z-notification)',
  '@media (max-width: 767.98px)': { left: '16px', maxWidth: 'calc(100vw - 32px)' },
})

const regionStyle = css({ display: 'flex', flexDirection: 'column', gap: '8px' })

/* The stack lets clicks through to the page; an action takes them back. `contents` keeps the
   button a flex item of the toast, as the design system lays it out. */
const actionFormStyle = css({ display: 'contents', pointerEvents: 'auto' })

const leavingStyle = css({
  animation: 'publikace-toast-leave 300ms ease-in-out 5s forwards',
  '@media (prefers-reduced-motion: reduce)': { animationDuration: '1ms' },
})

/* A keyframes rule is not a style of one element, so it is written as a sheet beside them. */
const LEAVE_KEYFRAMES =
  '@keyframes publikace-toast-leave { to { opacity: 0; visibility: hidden; } }'

/** The design system's `Toast`; an error carries its alert icon, as the design system draws it. */
export function Toasts(handle: Handle<ToastsProps>) {
  return () => {
    let { messages } = handle.props
    let errors = messages.filter((toast) => toast.tone === 'error')
    let confirmations = messages.filter((toast) => toast.tone === 'neutral')

    return (
      <div mix={stackStyle}>
        {confirmations.length > 0 ? <style>{LEAVE_KEYFRAMES}</style> : null}
        <div mix={regionStyle} role="alert">
          {errors.map((toast) => (
            <div class="vdm-toast vdm-toast--error">
              <svg
                aria-hidden="true"
                class="vdm-toast__icon"
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
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
              <span class="vdm-toast__text">{toast.message}</span>
            </div>
          ))}
        </div>
        <div mix={regionStyle} role="status">
          {/* A toast with an action stays until the next load: the action must not leave before a
              keyboard reaches it. */}
          {confirmations.map((toast) => (
            <div class="vdm-toast" mix={toast.action === undefined ? leavingStyle : undefined}>
              <span class="vdm-toast__text">
                {toast.message}
                {toast.detail === undefined ? null : (
                  <span class="vdm-toast__detail">{toast.detail}</span>
                )}
              </span>
              {toast.action === undefined ? null : (
                <form action={toast.action.action} method="post" mix={actionFormStyle}>
                  <CsrfField />
                  <button class="vdm-toast__action" type="submit">
                    {toast.action.label}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
}
