import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import { tied } from '../../../domain/public/typography.ts'

const iconStyle = css({ marginLeft: '2px', verticalAlign: '-0.125em' })

/**
 * The design system's `external-link` icon after a link that opens a new tab, and what a screen
 * reader hears of it (tyxr2jqk). It goes last inside the `<a target="_blank">`.
 */
export function NewTabMark(_handle: Handle) {
  return () => (
    <>
      <svg
        aria-hidden="true"
        fill="none"
        height="1em"
        mix={iconStyle}
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 24 24"
        width="1em"
      >
        <path d="M15 3h6v6" />
        <path d="M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </svg>
      <span class="vdm-sr-only">{tied` (otevře se v nové záložce)`}</span>
    </>
  )
}
