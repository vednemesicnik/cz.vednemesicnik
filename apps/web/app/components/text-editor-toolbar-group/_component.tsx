import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  /** Stands at the end of the toolbar, like undo and redo (24a). */
  isAtEnd?: boolean
  children: ReactNode
}

/**
 * Buttons of `TextEditorToolbar` that belong together, set off from the
 * previous group by a hairline (design 24a).
 */
export const TextEditorToolbarGroup = ({
  isAtEnd = false,
  children,
}: Props) => (
  <div className={clsx(styles.group, isAtEnd && styles.atEnd)}>{children}</div>
)
