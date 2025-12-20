import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const Footer = ({ children }: Props) => {
  return <footer className={styles.container}>{children}</footer>
}
