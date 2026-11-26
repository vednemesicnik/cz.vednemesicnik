import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A list's main action on a phone, in a bar that stays at the bottom of the
 * screen, in reach of the thumb, and never hides (22g, d9en8oih, design 32).
 * It stands in the flow after the pagination, so at the end of the list it
 * settles on the footer and covers nothing. From 768 px the action is in the
 * `ListHeader` instead, and the bar is not shown.
 *
 * @param props.children - The same button the list's header has, rendered
 *   only where the header renders it.
 * @returns The bar
 */
export const ListActionBar = ({ children, className }: Props) => (
  <div className={clsx(styles.bar, className)}>{children}</div>
)
