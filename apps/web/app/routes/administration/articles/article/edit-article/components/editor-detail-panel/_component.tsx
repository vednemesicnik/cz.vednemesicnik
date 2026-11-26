import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { useEditorDetail } from '../editor-detail'
import styles from './_styles.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * The panel of an `EditorDetail`: a labelled group beside the text, and on a
 * phone a dialog over the whole screen while it is open (24f). Esc closes the
 * open panel.
 *
 * @param props.children - `EditorDetailBar`, then the detail's fields.
 */
export const EditorDetailPanel = ({ className, children }: Props) => {
  const { headingId, isOpen, onClose, panelId } = useEditorDetail()

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the role is set, dialog or group, both named by the heading
    // biome-ignore lint/a11y/noStaticElementInteractions: as above; Esc closes the open panel
    <div
      aria-labelledby={headingId}
      aria-modal={isOpen || undefined}
      className={clsx(styles.panel, isOpen && styles.isOpen, className)}
      id={panelId}
      onKeyDown={(event) => {
        if (isOpen && event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
      }}
      role={isOpen ? 'dialog' : 'group'}
    >
      {children}
    </div>
  )
}
