import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const AdministrationPage = ({ children }: Props) => {
  return <main className={styles.page}>{children}</main>
}
