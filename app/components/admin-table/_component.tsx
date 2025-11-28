import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const AdminTable = ({ children }: Props) => {
  return <table className={styles.table}>{children}</table>
}