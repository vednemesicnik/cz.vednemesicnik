import type { ReactNode } from "react"
import styles from "./_app-layout.module.css"

type Props = {
  children: ReactNode
}

export const AppLayout = ({ children }: Props) => {
  return <body className={styles.container}>{children}</body>
}

AppLayout.displayName = "AppLayout"
