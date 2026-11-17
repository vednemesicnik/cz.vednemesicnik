import { clsx } from 'clsx'

import { CopyButton } from '~/components/copy-button'

import styles from './_styles.module.css'

type Props = {
  value: string
  className?: string
}

/**
 * The request's code in a frame, with a copy button so it can go into an
 * e-mail (15l, 17c).
 */
export const RequestIdBadge = ({ value, className }: Props) => {
  return (
    <div className={clsx(styles.requestIdBadge, className)}>
      <span className={styles.label}>Kód žádosti</span>
      <span className={styles.value}>
        <CopyButton value={value}>{value}</CopyButton>
      </span>
    </div>
  )
}
