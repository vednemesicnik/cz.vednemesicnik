import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { Label } from '~/components/label'

import styles from './_styles.module.css'

type Props = ComponentProps<'input'> & {
  label: string
  errors?: string[]
  hint?: ReactNode
  containerClassName?: string
}

export const AdminInput = ({
  label,
  errors,
  hint,
  id,
  required,
  className,
  containerClassName,
  ...rest
}: Props) => {
  const hasErrors = errors !== undefined && errors.length > 0
  const hintId =
    hint !== undefined && id !== undefined ? `${id}-hint` : undefined
  // Keep the error description a form library passes and add the hint to it.
  const describedBy =
    [rest['aria-describedby'], hintId].filter(Boolean).join(' ') || undefined

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
        aria-describedby={describedBy}
      />
      {hint !== undefined && (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      )}
      <ErrorMessageGroup>
        {errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
