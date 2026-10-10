import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  title: ReactNode
  status?: ReactNode
  note?: ReactNode
  actions?: ReactNode
  // A line under the row, e.g. the amber warning about running out of codes.
  footer?: ReactNode
  className?: string
}

/**
 * One sign-in method on the settings page (design 29a): its name, a status
 * word, a note under them and the actions on the right.
 */
export const SettingsRow = ({
  title,
  status,
  note,
  actions,
  footer,
  className,
}: Props) => (
  <div className={clsx(styles.row, className)}>
    <div className={styles.text}>
      <span className={styles.title}>{title}</span>
      {status !== undefined && <span className={styles.status}>{status}</span>}
      {note !== undefined && <span className={styles.note}>{note}</span>}
    </div>
    {actions !== undefined && <div className={styles.actions}>{actions}</div>}
    {footer !== undefined && <div className={styles.footer}>{footer}</div>}
  </div>
)
