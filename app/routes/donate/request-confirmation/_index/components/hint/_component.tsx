import type { ReactNode } from 'react'

import { InfoIcon } from '~/components/icons/info-icon'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const Hint = ({ children }: Props) => (
  <span className={styles.hint}>
    <InfoIcon className={styles.icon} />
    {children}
  </span>
)
