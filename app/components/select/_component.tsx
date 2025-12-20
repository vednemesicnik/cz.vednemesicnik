import type { ComponentProps, ReactNode } from 'react'

import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { Label } from '~/components/label'

import styles from './_styles.module.css'

type Props = ComponentProps<'select'> & {
  label: string
  errors?: string[]
  children: ReactNode
}

export const Select = ({
  label,
  errors,
  id,
  children,
  required,
  ...rest
}: Props) => {
  return (
    <section className={styles.container}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <select className={styles.select} id={id} {...rest}>
        {children}
      </select>
      <ErrorMessageGroup>
        {errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
