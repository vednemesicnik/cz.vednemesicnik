import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The text column of a `CoverHeader` (design 13b, 13c): the headline and what
 * goes under it, such as the count or the date, and the description.
 *
 * @returns The text column
 */
export const CoverHeaderBody = ({ children, className }: Props) => {
  // `data-cover-header-body` places it in the header's grid.
  return (
    <div className={clsx(styles.body, className)} data-cover-header-body>
      {children}
    </div>
  )
}
