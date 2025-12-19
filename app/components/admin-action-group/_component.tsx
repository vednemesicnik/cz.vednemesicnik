import { clsx } from "clsx"
import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
  className?: string
}

export const AdminActionGroup = ({ children, className }: Props) => (
  <div className={clsx(styles.group, className)}>{children}</div>
)
