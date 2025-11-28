import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const TableCell = ({ children }: Props) => {
  return <td className={styles.cell}>{children}</td>
}