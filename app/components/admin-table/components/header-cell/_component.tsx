import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const TableHeaderCell = ({ children }: Props) => {
  return <th className={styles.headerCell}>{children}</th>
}
