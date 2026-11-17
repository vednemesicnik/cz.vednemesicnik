import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const FieldGroup = ({ children }: Props) => (
  <fieldset className={styles.fieldset}>{children}</fieldset>
)
