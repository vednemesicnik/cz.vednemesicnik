import type { Handle, RemixNode } from 'remix/component'

/**
 * The design system's `ListHeader`: the page title of a list (`ListHeaderTitle`) and its one
 * action (`ListHeaderAction`).
 */
export function ListHeader(handle: Handle<{ children?: RemixNode }>) {
  return () => <div class="vdm-list-header">{handle.props.children}</div>
}
