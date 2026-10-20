import type { ReactNode } from 'react'

import { ErrorIcon } from '~/components/icons/error-icon'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const ErrorMessage = ({ children }: Props) => {
  return (
    <div className={styles.container}>
      <ErrorIcon className={styles.icon} />

      <p className={styles.error} role={'alert'}>
        {children}
      </p>
    </div>
  )
}
