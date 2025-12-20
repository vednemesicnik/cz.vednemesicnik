import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const TileGrid = ({ children }: Props) => {
  return <ul className={styles.grid}>{children}</ul>
}
