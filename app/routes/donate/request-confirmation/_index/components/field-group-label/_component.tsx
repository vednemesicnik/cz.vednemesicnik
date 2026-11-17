import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  required?: boolean
}

export const FieldGroupLabel = ({ children, required }: Props) => (
  <legend className={styles.legend}>
    {children}
    {required ? (
      <>
        {' '}
        <span className={styles.required}>*</span>
      </>
    ) : null}
  </legend>
)
