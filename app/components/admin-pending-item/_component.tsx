import { clsx } from 'clsx'
import { Link } from 'react-router'

import styles from './_styles.module.css'

type Props = {
  to: string
  title: string
  author: string
  date: Date
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
  const formattedDate = new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)

  return (
    <Link className={clsx(styles.item, className)} to={to}>
      <div className={styles.header}>
        <span className={styles.type}>{type}</span>
        <span className={styles.date}>{formattedDate}</span>
      </div>
      <div className={styles.title}>{title}</div>
      <div className={styles.author}>Autor: {author}</div>
    </Link>
  )
}
