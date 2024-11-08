import { combineClasses } from "@liborgabrhel/style-utils"
import { type ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  to: string
  title?: string
  className?: string
  children: ReactNode
}

export const Hyperlink = ({ to, title, className, children }: Props) => {
  return (
    <a
      href={to}
      className={combineClasses(styles.hyperlink, className)}
      title={title}
      target={"_blank"}
      rel="noreferrer"
    >
      {children}
      {/* TODO: add "new tab" icon with alt text "opens in new tab" */}
    </a>
  )
}
