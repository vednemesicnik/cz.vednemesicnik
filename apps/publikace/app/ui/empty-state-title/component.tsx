import type { Handle, RemixNode } from 'remix/component'

/** The first line of an `EmptyState`: _Zatím tu není žádné vydání_. */
export function EmptyStateTitle(handle: Handle<{ children?: RemixNode }>) {
  return () => <p class="vdm-empty__title">{handle.props.children}</p>
}
