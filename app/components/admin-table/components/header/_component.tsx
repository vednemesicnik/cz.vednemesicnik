import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const TableHeader = ({ children }: Props) => {
  return (
    <thead className={styles.header}>
      <tr>{children}</tr>
    </thead>
  )
}
