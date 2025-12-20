import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const ErrorMessageGroup = ({ children }: Props) => {
  return <div className={styles.container}>{children}</div>
}
