import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { ErrorIcon } from '~/components/icons/error-icon'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const Alert = ({ children, className }: Props) => {
  return (
    <div className={clsx(styles.alert, className)} role="alert">
      <ErrorIcon className={styles.icon} />
      <p className={styles.message}>{children}</p>
    </div>
  )
}
