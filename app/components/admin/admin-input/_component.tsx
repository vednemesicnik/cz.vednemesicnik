import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { Label } from '~/components/label'

import styles from './_styles.module.css'

type Props = ComponentProps<'input'> & {
  label: string
  errors?: string[]
  containerClassName?: string
}

export const AdminInput = ({
  label,
  errors,
  id,
  required,
  className,
  containerClassName,
  ...rest
}: Props) => {
  const hasErrors = errors !== undefined && errors.length > 0

  return (
    <section className={clsx(styles.container, containerClassName)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <input
        className={clsx(
          styles.input,
          hasErrors && styles.inputError,
          className,
        )}
        id={id}
        required={required}
        {...rest}
      />
      <ErrorMessageGroup>
        {errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
