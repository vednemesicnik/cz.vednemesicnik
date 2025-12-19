import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const Content = ({ children }: Props) => {
  return <main className={styles.container}>{children}</main>
}
