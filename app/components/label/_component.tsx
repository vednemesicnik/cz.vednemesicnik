import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = ComponentProps<'label'> & {
  required?: boolean
}

export const Label = ({
  children,
  className,
  required,
  htmlFor,
  ...rest
}: Props) => {
  return (
    <label
      className={clsx(styles.label, className)}
      htmlFor={htmlFor}
      {...rest}
    >
      {children} {required && '*'}
    </label>
  )
}
