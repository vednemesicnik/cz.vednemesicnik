import { clsx } from "clsx"
import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  label: string
  value: number | string
  icon?: ReactNode
  subtext?: string
  className?: string
}

export const AdminStatCard = ({
  label,
  value,
  icon,
  subtext,
  className,
}: Props) => {
  return (
    <div className={clsx(styles.card, className)}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <div className={styles.value}>{value}</div>
        <div className={styles.label}>{label}</div>
        {subtext && <div className={styles.subtext}>{subtext}</div>}
      </div>
    </div>
  )
}