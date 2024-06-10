import styles from "./_archived-issues-list-item.module.css"
import type { ComponentProps } from "react"
import { combineClasses } from "@liborgabrhel/style-utils"

type Props = ComponentProps<"li">

export const ArchivedIssuesListItem = ({ children, className, ...rest }: Props) => {
  return (
    <li className={combineClasses(styles.list_item, className)} {...rest}>
      {children}
    </li>
  )
}
