import type { ReactNode } from "react"
import styles from "./_page-subheading.module.css"

type Props = {
  children: ReactNode
}

export const PageSubheading = ({ children }: Props) => {
  return <p className={styles.subheadline}>{children}</p>
}
