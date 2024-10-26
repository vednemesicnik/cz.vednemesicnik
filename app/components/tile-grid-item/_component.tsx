import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export function TileGridItem({ children }: Props) {
  return <li className={styles.container}>{children}</li>
}
