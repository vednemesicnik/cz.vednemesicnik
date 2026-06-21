import { clsx } from 'clsx'
import styles from './_styles.module.css'

type Props = {
  value: string
  className?: string
}

export const RequestIdBadge = ({ value, className }: Props) => {
  return (
    <div className={clsx(styles.requestIdBadge, className)}>
      <span className={styles.label}>Referenční kód</span>
      <span className={styles.value}>{value}</span>
    </div>
  )
}
