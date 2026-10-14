import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A list's header in one row: the title on the left, the list's main action
 * on the right (22a). Nothing that comes and goes belongs in it, so the table
 * under it never moves; work waiting for someone is a count on the state
 * filter (cioukqn6).
 *
 * @param props.children - The `PageTitle`, then the main action, usually a
 * primary `LinkButton`.
 * @returns The header
 */
export const ListHeader = ({ children, className }: Props) => {
  return <header className={clsx(styles.row, className)}>{children}</header>
}
