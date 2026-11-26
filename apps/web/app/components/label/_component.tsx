import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = ComponentProps<'label'> & {
  /** The asterisk, hidden from readers: the input's `required` tells them. */
  required?: boolean
  /** „(nepovinné)“ after the label. */
  optional?: boolean
}

export const Label = ({
  children,
  className,
  required,
  optional,
  htmlFor,
  ...rest
}: Props) => {
  return (
    <label
      className={clsx(styles.label, className)}
      htmlFor={htmlFor}
      {...rest}
    >
      {children}
      {required && (
        <>
          {' '}
          <span aria-hidden={true}>*</span>
        </>
      )}
      {optional && (
        <>
          {' '}
          <span className={styles.optional}>(nepovinné)</span>
        </>
      )}
    </label>
  )
}
