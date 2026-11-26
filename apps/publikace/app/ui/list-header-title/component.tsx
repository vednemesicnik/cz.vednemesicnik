import type { Handle, RemixNode } from 'remix/component'

/**
 * The page's `<h1>` inside a `ListHeader`. `isFocused` where the page arrives after a step whose
 * subject is gone, so focus lands on the heading rather than nowhere (`12w`).
 */
export function ListHeaderTitle(handle: Handle<{ children?: RemixNode; isFocused?: boolean }>) {
  return () =>
    handle.props.isFocused === true ? (
      <h1 autofocus class="vdm-page-title" tabIndex={-1}>
        {handle.props.children}
      </h1>
    ) : (
      <h1 class="vdm-page-title">{handle.props.children}</h1>
    )
}
