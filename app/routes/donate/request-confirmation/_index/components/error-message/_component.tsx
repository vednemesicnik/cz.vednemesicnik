import type { ReactNode } from 'react'

import { ErrorIcon } from '~/components/icons/error-icon'

import styles from './_styles.module.css'

type Props = {
  children?: ReactNode
}

export const ErrorMessage = ({ children }: Props) =>
  children ? (
    <div className={styles.container}>
      <ErrorIcon className={styles.icon} />
      <span className={styles.error}>{children}</span>
    </div>
  ) : null
