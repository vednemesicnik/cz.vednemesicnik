import type { Handle, RemixNode } from 'remix/component'

/** The action beside the title of a `ListHeader`: _Nové vydání_. */
export function ListHeaderAction(handle: Handle<{ children?: RemixNode }>) {
  return () => <div class="vdm-list-header__action">{handle.props.children}</div>
}
