import type { Handle } from 'remix/component'
import { css } from 'remix/component'

export type ToastsProps = {
  messages: readonly string[]
}

/*
 * Bottom left, over the page and clear of the panel's foot.
 *
 * The message arrives with the page after a redirect, and a screen reader does not announce a
 * status that is already there when the page loads; the outcome is carried by the page itself,
 * the new row in the list. So a confirmation leaves by itself after five seconds, in CSS, as the
 * page has no script to time it.
 */
const regionStyle = css({
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

const toastStyle = css({
  animation: 'publikace-toast-leave 300ms ease-in-out 5s forwards',
  '@media (prefers-reduced-motion: reduce)': { animationDuration: '1ms' },
})

/* A keyframes rule is not a style of one element, so it is written as a sheet beside them. */
const LEAVE_KEYFRAMES =
  '@keyframes publikace-toast-leave { to { opacity: 0; visibility: hidden; } }'

/** The design system's `Toast`, neutral tone, in a status region. */
export function Toasts(handle: Handle<ToastsProps>) {
  return () => (
    <div mix={regionStyle} role="status">
      {handle.props.messages.length > 0 ? <style>{LEAVE_KEYFRAMES}</style> : null}
      {handle.props.messages.map((message) => (
        <div class="vdm-toast" mix={toastStyle}>
          <span class="vdm-toast__text">{message}</span>
        </div>
      ))}
    </div>
  )
}
