import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const TableRow = ({ children }: Props) => {
  return <tr className={styles.row}>{children}</tr>
}
