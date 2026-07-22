import { clsx } from 'clsx'
import { Link } from 'react-router'

import type { FormattedDate } from '~/utils/format-date'

import styles from './_styles.module.css'

type Props = {
  to: string
  title: string
  author: string
  date: FormattedDate
  type: string
  className?: string
}

export const AdminPendingItem = ({
  to,
  title,
  author,
  date,
  type,
  className,
}: Props) => {
  return (
    <Link className={clsx(styles.item, className)} to={to}>
      <div className={styles.header}>
        <span className={styles.type}>{type}</span>
        <span className={styles.date}>
          <time dateTime={date.iso ?? undefined}>{date.formatted}</time>
        </span>
      </div>
      <div className={styles.title}>{title}</div>
      <div className={styles.author}>Autor: {author}</div>
    </Link>
  )
}
