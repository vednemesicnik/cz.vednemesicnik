import type { ReactNode } from "react"
import styles from "./_archived-issues-list.module.css"

type Props = {
  children: ReactNode
}

export const ArchivedIssuesList = ({ children }: Props) => {
  return <ul className={styles.list}>{children}</ul>
}
