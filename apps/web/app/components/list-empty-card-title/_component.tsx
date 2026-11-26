import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The title of an empty list's card (design 22e).
 *
 * @returns The title
 */
export const ListEmptyCardTitle = ({ children, className }: Props) => (
  <p className={clsx(styles.listEmptyCardTitle, className)}>{children}</p>
)
