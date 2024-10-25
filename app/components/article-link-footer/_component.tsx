import { type ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const ArticleLinkFooter = ({ children }: Props) => {
  return <footer className={styles.footer}>{children}</footer>
}
