import { clsx } from 'clsx'
import type { ReactNode, Ref } from 'react'

import styles from './_styles.module.css'

type Props = {
  /** `AuthorListItem`s. */
  children: ReactNode
  ref?: Ref<HTMLUListElement>
  className?: string
}

/**
 * The article's chosen authors as rows, the search field under them (design
 * 24j).
 */
export const AuthorList = ({ children, ref, className }: Props) => (
  <ul className={clsx(styles.list, className)} ref={ref}>
    {children}
  </ul>
)
