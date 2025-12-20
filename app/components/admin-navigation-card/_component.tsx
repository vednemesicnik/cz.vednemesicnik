import { clsx } from "clsx"
import type { ReactNode } from "react"

import { BaseLink } from "~/components/base-link"

import styles from "./_styles.module.css"

type Props = {
  to: string
  icon?: ReactNode
  title: string
  description?: string
  className?: string
}

export const AdminNavigationCard = ({
  to,
  icon,
  title,
  description,
  className,
}: Props) => {
  return (
    <BaseLink to={to} className={clsx(styles.card, className)}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </div>
    </BaseLink>
  )
}
