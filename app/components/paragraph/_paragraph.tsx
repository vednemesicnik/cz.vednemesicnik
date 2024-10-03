import { type ReactNode } from "react"

import styles from "./_paragraph.module.css"

type Props = {
  children: ReactNode
}

export const Paragraph = ({ children }: Props) => {
  return <p className={styles.paragraph}>{children}</p>
}
