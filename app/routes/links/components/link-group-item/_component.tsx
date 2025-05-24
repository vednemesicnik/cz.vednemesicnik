import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}
export const LinkGroupItem = ({ children }: Props) => {
  return <li className={styles.linkGroupItem}>{children}</li>
}
