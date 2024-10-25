import { type ReactNode } from "react"

import styles from "./_hyperlink.module.css"

type Props = {
  children: ReactNode
  to: string
}

export const Hyperlink = ({ children, to }: Props) => {
  return (
    <a
      href={to}
      className={styles.hyperlink}
      target={"_blank"}
      rel="noreferrer"
    >
      {children}
      {/* TODO: add "new tab" icon with alt text "opens in new tab" */}
    </a>
  )
}
