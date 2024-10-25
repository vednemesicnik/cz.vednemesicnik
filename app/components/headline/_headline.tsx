import type { ReactNode } from "react"

import styles from "./_headline.module.css"

type Props = {
  children: ReactNode
}

export const Headline = ({ children }: Props) => {
  return <h2 className={styles.headline}>{children}</h2>
}
