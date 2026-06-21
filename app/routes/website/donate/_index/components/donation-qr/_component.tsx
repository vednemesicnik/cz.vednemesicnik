import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const DonationQr = ({ children }: Props) => {
  return <aside className={styles.donationQr}>{children}</aside>
}
