import type { Handle, RemixNode } from 'remix/component'

/** The page's `<h1>` inside a `ListHeader`. */
export function ListHeaderTitle(handle: Handle<{ children?: RemixNode }>) {
  return () => <h1 class="vdm-page-title">{handle.props.children}</h1>
}
