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
 * filter (cioukqn6). Below 768 px the top bar names the page, so the title
 * stays for screen readers only, and the main action waits in a
 * `ListActionBar` at the bottom (22g, design 32).
 *
 * @param props.children - The `PageTitle`, then the main action, usually a
 * primary `LinkButton`.
 * @returns The header
 */
export const ListHeader = ({ children, className }: Props) => {
  return (
    <header className={clsx(styles.row, styles.foldsOnPhone, className)}>
      {children}
    </header>
  )
}
