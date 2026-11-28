import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import { tied } from '../../domain/public/typography.ts'
import { CsrfField } from '../csrf-field/component.tsx'
import { TOAST_CLOSED_ATTRIBUTE, ToastClose } from '../public/toast-close/component.tsx'

export type ToastTone = 'error' | 'neutral'

/**
 * An action the toast offers, such as _Vrátit_ after _Je to souhlas_ (`13b`): a form posting to
 * `action`, so it works with no script, as the same button on the card does.
 */
export type ToastAction = { action: string; label: string }

/**
 * `detail` is the line under the message: who and when, in the shape of a tag's line, when
 * somebody else got there first (`12l`, _21. 11. v 9:40 · Jana Veselá_), or the addresses an
 * e-mail went to or did not (`12y`), an error's toast included.
 */
export type ToastMessage = {
  action?: ToastAction
  detail?: string
  /**
   * Drawn closed: the person closed it before the page reloaded itself (`11g`), so it keeps its
   * room and stays out of sight. Never kept in the session.
   */
  isClosed?: boolean
  message: string
  tone: ToastTone
}

/** The close button's name, through the copywriter (`f2t9zlyw`). */
export const CLOSE_TOAST_LABEL = tied`Zavřít hlášku`

export type ToastsProps = {
  messages: readonly ToastMessage[]
}

/*
 * Where the stack stands is the page's to decide (`Layout`), because the room the page leaves
 * for it is counted from the page's own padding.
 *
 * The browser runtime draws the next page into the same document, so these regions stay and a
 * message put into them is announced: a confirmation politely, from `status`, an error at once,
 * from `alert`. Two sibling regions rather than one inside the other, which a screen reader may
 * read twice. A confirmation leaves by itself after five seconds, in CSS; an error stays, because
 * it asks for a step and could otherwise leave before it is read.
 *
 * No gap between the regions: a page has one toast at most, because the session carries one
 * message, so one of them is always empty, and a gap beside it would push the toast off its place
 * and give an empty stack a height.
 */
const stackStyle = css({
  display: 'flex',
  flexDirection: 'column',
  pointerEvents: 'none',
})

const regionStyle = css({ display: 'flex', flexDirection: 'column', gap: '8px' })

/* The stack lets clicks through to the page; a toast with an action or a close button takes them
   back (`components.css`). `contents` keeps the button a flex item of the toast, as the design
   system lays it out. */
const actionFormStyle = css({ display: 'contents', pointerEvents: 'auto' })

/* A closed toast hides as one that left does, keeping its room (`11f`); hidden, it takes no tap
   and is not read. */
const closedStyle = css({ [`&[${TOAST_CLOSED_ATTRIBUTE}]`]: { visibility: 'hidden' } })

const leavingStyle = css({
  animation: 'publikace-toast-leave 300ms ease-in-out 5s forwards',
  '@media (prefers-reduced-motion: reduce)': { animationDuration: '1ms' },
})

/* A keyframes rule is not a style of one element, so it is written as a sheet beside them. It
   ends hidden rather than removed, so a toast that left keeps its room at the page's end until
   the next load and the end does not jump under a finger (`11f`). */
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
            <div
              class="vdm-toast vdm-toast--error"
              data-closed={toast.isClosed === true ? '' : undefined}
              mix={closedStyle}
            >
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
              <span class="vdm-toast__text">
                {toast.message}
                {toast.detail === undefined ? null : (
                  <span class="vdm-toast__detail">{toast.detail}</span>
                )}
              </span>
              <ToastClose label={CLOSE_TOAST_LABEL} />
            </div>
          ))}
        </div>
        <div mix={regionStyle} role="status">
          {/* A toast with an action stays until the next load, so that the action does not leave
              before a keyboard reaches it, and the person closes it (`11g`). */}
          {confirmations.map((toast) => (
            <div
              class="vdm-toast"
              data-closed={toast.isClosed === true ? '' : undefined}
              mix={toast.action === undefined ? leavingStyle : closedStyle}
            >
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
              {toast.action === undefined ? null : <ToastClose label={CLOSE_TOAST_LABEL} />}
            </div>
          ))}
        </div>
      </div>
    )
  }
}
