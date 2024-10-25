import { type ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const TileTitle = ({ children }: Props) => {
  return <h3 className={styles.title}>{children}</h3>
}
