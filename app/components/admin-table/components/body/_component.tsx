import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const TableBody = ({ children }: Props) => {
  return <tbody className={styles.body}>{children}</tbody>
}