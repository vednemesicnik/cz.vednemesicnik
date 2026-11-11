import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The action of a `ListDetailRow`, last inside its `AdminDetailRowValue`: under
 * the list and its description, aligned left, so it never lines up with the
 * items' actions (29a, 0p3dlr4w). A full-width line takes `flex-basis: 100%`.
 */
export const ListDetailRowActions = ({ children, className }: Props) => (
  <div className={clsx(styles.actions, className)}>{children}</div>
)
