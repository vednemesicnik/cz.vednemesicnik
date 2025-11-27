import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const Dropdown = ({ children }: Props) => {
  return <div className={styles.dropdown}>{children}</div>
}
