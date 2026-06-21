import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const DonationQrHint = ({ children }: Props) => {
  return <p className={styles.qrHint}>{children}</p>
}
