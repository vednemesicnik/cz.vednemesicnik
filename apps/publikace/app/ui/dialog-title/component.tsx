import type { Handle, RemixNode } from 'remix/component'

import { Dialog } from '../dialog/component.tsx'

/** The heading of a `Dialog`, which the dialog is named by. */
export function DialogTitle(handle: Handle<{ children?: RemixNode }>) {
  return () => (
    <h2 class="vdm-dialog__title" id={handle.context.get(Dialog).titleId}>
      {handle.props.children}
    </h2>
  )
}
