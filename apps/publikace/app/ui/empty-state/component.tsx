import type { Handle, RemixNode } from 'remix/component'

/*
 * `11b` draws it flush left and without the dashed frame of the design system's card: it
 * stands where the rows would, not as a box of its own. Inline, as the drawing writes it,
 * because `css()` sits in a cascade layer and would lose to `.vdm-empty` on the same element.
 */
const EMPTY_STYLE = {
  alignItems: 'flex-start',
  border: 0,
  borderRadius: 0,
  gap: '8px',
  padding: '24px 0',
  textAlign: 'left',
} as const

/**
 * The design system's `.vdm-empty`: what is not here yet, and the next step, which every empty
 * state offers (`11b`). Its words are `EmptyStateTitle` and `EmptyStateText`; the step is a
 * button or a link after them.
 */
export function EmptyState(handle: Handle<{ children?: RemixNode }>) {
  return () => (
    <div class="vdm-empty" style={EMPTY_STYLE}>
      {handle.props.children}
    </div>
  )
}
