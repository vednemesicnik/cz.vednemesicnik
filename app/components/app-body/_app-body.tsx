import type { ReactNode } from "react"
import styles from "./_app-body.module.css"

type Props = {
  children: ReactNode
}

export const AppBody = ({ children }: Props) => {
  return <main className={styles.container}>{children}</main>
}

AppBody.displayName = "AppBody"
