import type { Handle, RemixNode } from 'remix/component'

export type DialogProps = {
  children?: RemixNode
  /** `360px` for a question, `460px` for a dialog with a field (`14b`, `11d`). */
  maxWidth: string
}

export type DialogContext = { titleId: string }

/**
 * The design system's `Dialog`, drawn over the page at its own address: the page under it is
 * made inert by `Layout`, so it works with no script to open it as a modal. `DialogTitle`
 * names it.
 */
export function Dialog(handle: Handle<DialogProps, DialogContext>) {
  let titleId = `dialog-title-${handle.id}`
  handle.context.set({ titleId })

  return () => (
    <div class="vdm-dialog-backdrop">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        class="vdm-dialog"
        role="dialog"
        style={{ maxWidth: handle.props.maxWidth, width: '100%' }}
      >
        {handle.props.children}
      </div>
    </div>
  )
}
