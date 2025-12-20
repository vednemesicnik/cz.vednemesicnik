import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const ListItem = ({ children }: Props) => {
  return <li className={styles.listItem}>{children}</li>
}
