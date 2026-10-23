import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  /** For the field the errors belong to, as its `aria-describedby`. */
  id?: string
}

export const ErrorMessageGroup = ({ children, id }: Props) => {
  return (
    <div className={styles.container} id={id}>
      {children}
    </div>
  )
}
