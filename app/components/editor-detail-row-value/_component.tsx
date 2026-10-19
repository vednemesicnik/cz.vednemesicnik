import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * An `EditorDetailRow`'s value on one line, cut with an ellipsis. Thumbnails
 * (`EditorDetailRowThumbnails`) go first inside it, so the text after them is
 * what gets cut.
 */
export const EditorDetailRowValue = ({ children, className }: Props) => (
  <span className={clsx(styles.editorDetailRowValue, className)}>
    {children}
  </span>
)
