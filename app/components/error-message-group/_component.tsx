import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  /** For the field the errors belong to, as its `aria-describedby`. */
  id?: string
  className?: string
}

export const ErrorMessageGroup = ({ children, id, className }: Props) => {
  return (
    <div className={clsx(styles.container, className)} id={id}>
      {children}
    </div>
  )
}
