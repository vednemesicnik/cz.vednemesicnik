import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'input'>, 'type'> & {
  errors?: string[]
  label: string
}

export const AdminRadioInputBase = ({ errors, id, label, ...rest }: Props) => {
  const hasErrors = errors !== undefined && errors.length > 0

  return (
    <label className={styles.radioLabel} htmlFor={id}>
      <input
        className={clsx(styles.radio, hasErrors && styles.radioError)}
        id={id}
        type={'radio'}
        {...rest}
      />
      <span className={styles.labelText}>{label}</span>
    </label>
  )
}
