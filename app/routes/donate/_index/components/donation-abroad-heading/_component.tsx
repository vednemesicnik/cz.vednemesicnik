import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const DonationAbroadHeading = ({ children }: Props) => {
  return <h3 className={styles.heading}>{children}</h3>
}
