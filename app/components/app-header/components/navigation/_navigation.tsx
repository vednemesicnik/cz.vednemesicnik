import type { ReactNode } from "react"
import styles from "./_navigation.module.css"

type Props = {
  children: ReactNode
}

export const Navigation = ({ children }: Props) => (
  <nav className={styles.container}>
    <ul className={styles.list}>{children}</ul>
  </nav>
)
