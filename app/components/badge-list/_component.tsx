import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A flex-wrapping container for a row of {@link Badge} links (article
 * categories or tags). Keeps spacing consistent across the article detail and
 * the listing cards.
 */
export const BadgeList = ({ children, className }: Props) => {
  return <div className={clsx(styles.list, className)}>{children}</div>
}
