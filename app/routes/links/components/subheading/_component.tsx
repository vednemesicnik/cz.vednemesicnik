import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const Subheading = ({ children }: Props) => {
  return (
    <p className={styles.text}>{children}</p>
  )
}
