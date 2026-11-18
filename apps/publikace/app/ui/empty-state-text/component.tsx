import type { Handle, RemixNode } from 'remix/component'

/** The sentence under the title of an `EmptyState`, full width as `11b` draws it. */
export function EmptyStateText(handle: Handle<{ children?: RemixNode }>) {
  return () => (
    <p class="vdm-empty__text" style={{ margin: 0, maxWidth: 'none' }}>
      {handle.props.children}
    </p>
  )
}
