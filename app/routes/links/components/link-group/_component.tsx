import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const LinkGroup = ({ children }: Props) => {
  return (
    <ul className={styles.linkGroup}>
      {children}
    </ul>
  )
}