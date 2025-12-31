import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  label: string
  children: ReactNode
}

export const Tile = ({ label, children }: Props) => {
  return (
    <figure className={styles.container}>
      <div className={styles.card}>{children}</div>
      <figcaption className={styles.label}>{label}</figcaption>
    </figure>
  )
}
