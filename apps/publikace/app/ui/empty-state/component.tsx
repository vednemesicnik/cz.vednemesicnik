import type { Handle, RemixNode } from 'remix/component'

/**
 * The design system's `.vdm-empty`: what is not here yet, and the next step where the reader has
 * one. One shape on every screen and at every width (`11b`, `mndtjoni`): at the start, where the
 * missing rows would begin, with no frame and no padding of its own, so the screen's gap spaces
 * it. Its words are `EmptyStateTitle` and `EmptyStateText`; the step is a button or a link after
 * them. An empty section of a page is `EmptyStateText` alone, under the section's heading (`12c`).
 */
export function EmptyState(handle: Handle<{ children?: RemixNode }>) {
  return () => <div class="vdm-empty">{handle.props.children}</div>
}
