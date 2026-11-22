import type { Handle, RemixNode } from 'remix/component'

/** The sentence of an `EmptyState`, under its title or alone in an empty section. */
export function EmptyStateText(handle: Handle<{ children?: RemixNode }>) {
  return () => <p class="vdm-empty__text">{handle.props.children}</p>
}
