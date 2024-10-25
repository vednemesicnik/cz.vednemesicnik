import { type ReactNode } from "react"

import { Divider } from "~/components/divider"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
  isLast: boolean
}

export const ArticleListItem = ({ children, isLast }: Props) => {
  return (
    <li className={styles.listItem}>
      {children}
      {!isLast && <Divider variant={"secondary"} />}
    </li>
  )
}
