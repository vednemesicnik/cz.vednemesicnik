import { type ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
}

export const ErrorMessageGroup = ({ children }: Props) => {
  return <section className={styles.container}>{children}</section>
}
