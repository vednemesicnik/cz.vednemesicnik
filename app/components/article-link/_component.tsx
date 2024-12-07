import { type ReactNode } from "react"
import { Link } from "react-router"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
  to: string
}

export const ArticleLink = ({ children, to }: Props) => {
  return (
    <Link to={to} className={styles.link}>
      <article className={styles.article}>{children}</article>
    </Link>
  )
}
