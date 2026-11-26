import type { Handle } from 'remix/component'

import { NewTabMark } from '../new-tab-mark/component.tsx'

/** A sentence of a Callout: plain text, and links to Drive that open in a new tab. */
export type CalloutPart = string | { href: string; text: string }

export function CalloutParts(handle: Handle<{ parts: readonly CalloutPart[] }>) {
  return () => (
    <>
      {handle.props.parts.map((part) =>
        typeof part === 'string' ? (
          part
        ) : (
          <a class="vdm-link" href={part.href} rel="noopener" target="_blank">
            {part.text}
            <NewTabMark />
          </a>
        ),
      )}
    </>
  )
}
