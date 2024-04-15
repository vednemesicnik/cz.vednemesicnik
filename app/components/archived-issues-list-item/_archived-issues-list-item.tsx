import styles from "./_archived-issues-list-item.module.css"
import type { ComponentProps } from "react"
import { combineStyles } from "~/utils/combine-styles"

type Props = ComponentProps<"li">

export const ArchivedIssuesListItem = ({ children, className, ...rest }: Props) => {
  return (
    <li className={combineStyles(styles.list_item, className)} {...rest}>
      {children}
    </li>
  )
}
