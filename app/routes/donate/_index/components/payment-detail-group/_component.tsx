import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const PaymentDetailGroup = ({ children }: Props) => {
  return <p className={styles.group}>{children}</p>
}
