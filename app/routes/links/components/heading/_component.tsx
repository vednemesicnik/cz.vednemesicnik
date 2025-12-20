import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const Heading = ({ children }: Props) => {
  return <h1 className={styles.text}>{children}</h1>
}
