import { clsx } from "clsx"
import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
  className?: string
}

export const AdminDetailList = ({ children, className }: Props) => {
  return <dl className={clsx(styles.list, className)}>{children}</dl>
}
