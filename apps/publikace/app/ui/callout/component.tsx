import type { Handle, RemixNode } from 'remix/component'

export type CalloutProps = {
  children?: RemixNode
  /**
   * `info` has no icon; `warning` carries the triangle and `error` the circle-alert icon, as the
   * design system draws them. Warning is what waits for you, error what went wrong.
   */
  tone: 'error' | 'info' | 'warning'
}

/**
 * The design system's `Callout`: a tinted note inside the page. A `div` where the design system
 * writes `aside`: a note inside `main` is not a landmark of its own. An action goes into the
 * children as `<div class="vdm-callout__actions">`.
 */
export function Callout(handle: Handle<CalloutProps>) {
  return () => {
    let { children, tone } = handle.props

    if (tone === 'info') return <div class="vdm-callout">{children}</div>

    return (
      <div class={`vdm-callout vdm-callout--${tone} vdm-callout--icon`}>
        <svg
          aria-hidden="true"
          class="vdm-callout__icon"
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
          {tone === 'warning' ? (
            <>
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </>
          )}
        </svg>
        <div class="vdm-callout__body">{children}</div>
      </div>
    )
  }
}
