import { type ReactNode } from "react"

import { BaseLink } from "~/components/base-link"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
  to: string
}

export const ArticleLink = ({ children, to }: Props) => {
  return (
    <BaseLink to={to} className={styles.link}>
      <article className={styles.article}>{children}</article>
    </BaseLink>
  )
}
