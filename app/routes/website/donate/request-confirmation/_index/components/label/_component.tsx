import type { ComponentProps } from 'react'
import styles from './_styles.module.css'

type Props = ComponentProps<'label'> & {
  required?: boolean
}

export const Label = ({ children, required, htmlFor, ...props }: Props) => (
  <label className={styles.label} htmlFor={htmlFor} {...props}>
    {children}
    {required ? (
      <>
        {' '}
        <span className={styles.required}>*</span>
      </>
    ) : (
      <>
        {' '}
        <span className={styles.optional}>(nepovinné)</span>
      </>
    )}
  </label>
)
