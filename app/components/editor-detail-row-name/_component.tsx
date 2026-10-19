import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/** An `EditorDetailRow`'s name, in its 90 px column. */
export const EditorDetailRowName = ({ children, className }: Props) => (
  <span className={clsx(styles.editorDetailRowName, className)}>
    {children}
  </span>
)
