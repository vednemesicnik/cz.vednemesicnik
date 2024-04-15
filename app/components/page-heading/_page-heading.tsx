import type { ReactNode } from "react"
import styles from "./_page-heading.module.css"

type Props = {
  children: ReactNode
}

export const PageHeading = ({ children }: Props) => {
  return <h1 className={styles.headline}>{children}</h1>
}
