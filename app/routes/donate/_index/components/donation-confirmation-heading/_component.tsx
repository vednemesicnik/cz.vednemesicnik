import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const DonationConfirmationHeading = ({ children }: Props) => {
  return <h2 className={styles.heading}>{children}</h2>
}
